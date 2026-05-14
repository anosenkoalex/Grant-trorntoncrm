import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

export interface InitiateRegistrationDto {
  companyName: string;
  adminEmail: string;
  password: string;
  plan: SubscriptionPlan;
}

const PLAN_LIMITS: Record<SubscriptionPlan, number | null> = {
  STARTER: 10,
  BUSINESS: 50,
  ENTERPRISE: null,
};

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly stripe: Stripe | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY');
    this.stripe = secretKey ? new Stripe(secretKey) : null;
  }

  private getStripe(): Stripe {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }
    return this.stripe;
  }

  private getPriceId(plan: SubscriptionPlan): string {
    const key = `STRIPE_PRICE_${plan}` as const;
    const priceId = this.config.get<string>(key);
    if (!priceId) {
      throw new BadRequestException(
        `Stripe price for plan ${plan} is not configured`,
      );
    }
    return priceId;
  }

  async initiateRegistration(dto: InitiateRegistrationDto) {
    const stripe = this.getStripe();
    const appUrl =
      this.config.get<string>('APP_URL') ?? 'http://localhost:5173';

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.adminEmail },
    });
    if (existing) {
      throw new BadRequestException({
        code: 'EMAIL_TAKEN',
        message: 'Email already in use',
      });
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const priceId = this.getPriceId(dto.plan);

    const customer = await stripe.customers.create({ email: dto.adminEmail });

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/register/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/register?cancelled=1`,
      metadata: {
        companyName: dto.companyName,
        adminEmail: dto.adminEmail,
        plan: dto.plan,
      },
    });

    await this.prisma.pendingRegistration.create({
      data: {
        companyName: dto.companyName,
        adminEmail: dto.adminEmail,
        password: passwordHash,
        plan: dto.plan,
        sessionId: session.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return { url: session.url };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const stripe = this.getStripe();
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;
    }

    return { received: true };
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const pending = await this.prisma.pendingRegistration.findUnique({
      where: { sessionId: session.id },
    });

    if (!pending || pending.processedAt) return;

    const slug =
      pending.companyName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '') +
      '-' +
      Date.now();

    const subId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;

    const plan = pending.plan;
    let stripePriceId: string | null = null;
    let currentPeriodEnd: Date | null = null;

    if (subId) {
      const stripe = this.getStripe();
      const sub = await stripe.subscriptions.retrieve(subId);
      stripePriceId = sub.items.data[0]?.price.id ?? null;
      const subRaw = sub as unknown as { current_period_end: number };
      currentPeriodEnd = new Date(subRaw.current_period_end * 1000);
    }

    await this.prisma.$transaction(async (tx) => {
      const org = await tx.org.create({
        data: { name: pending.companyName, slug },
      });

      await tx.user.create({
        data: {
          email: pending.adminEmail,
          password: pending.password,
          role: 'SUPER_ADMIN',
          orgId: org.id,
          passwordUpdatedAt: new Date(),
          passwordSentAt: new Date(),
        },
      });

      const customerId =
        typeof session.customer === 'string'
          ? session.customer
          : (session.customer?.id ?? '');

      await tx.subscription.create({
        data: {
          orgId: org.id,
          stripeCustomerId: customerId,
          stripeSubId: subId ?? null,
          stripePriceId,
          plan,
          status: 'ACTIVE',
          currentPeriodEnd,
        },
      });

      await tx.pendingRegistration.update({
        where: { id: pending.id },
        data: { processedAt: new Date() },
      });
    });

    this.logger.log(`Org created for ${pending.adminEmail} with plan ${plan}`);
  }

  private async handleSubscriptionUpdated(sub: Stripe.Subscription) {
    const customerId =
      typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
    const existing = await this.prisma.subscription.findUnique({
      where: { stripeCustomerId: customerId },
    });
    if (!existing) return;

    const status = this.mapStripeStatus(sub.status);
    const subRaw = sub as unknown as { current_period_end: number };
    const currentPeriodEnd = new Date(subRaw.current_period_end * 1000);
    const priceId = sub.items.data[0]?.price.id;
    const plan = await this.planFromPriceId(priceId);

    await this.prisma.subscription.update({
      where: { stripeCustomerId: customerId },
      data: {
        status,
        currentPeriodEnd,
        stripePriceId: priceId ?? existing.stripePriceId,
        stripeSubId: sub.id,
        plan: plan ?? existing.plan,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
    });
  }

  private async handleSubscriptionDeleted(sub: Stripe.Subscription) {
    const customerId =
      typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
    await this.prisma.subscription.updateMany({
      where: { stripeCustomerId: customerId },
      data: { status: SubscriptionStatus.CANCELLED },
    });
  }

  private mapStripeStatus(status: string): SubscriptionStatus {
    const map: Record<string, SubscriptionStatus> = {
      active: SubscriptionStatus.ACTIVE,
      canceled: SubscriptionStatus.CANCELLED,
      past_due: SubscriptionStatus.PAST_DUE,
      trialing: SubscriptionStatus.TRIALING,
      incomplete: SubscriptionStatus.INCOMPLETE,
      incomplete_expired: SubscriptionStatus.CANCELLED,
      unpaid: SubscriptionStatus.PAST_DUE,
    };
    return map[status] ?? SubscriptionStatus.INCOMPLETE;
  }

  private async planFromPriceId(
    priceId: string | undefined,
  ): Promise<SubscriptionPlan | null> {
    if (!priceId) return null;
    const plans: SubscriptionPlan[] = ['STARTER', 'BUSINESS', 'ENTERPRISE'];
    for (const plan of plans) {
      const key = `STRIPE_PRICE_${plan}`;
      if (this.config.get<string>(key) === priceId) return plan;
    }
    return null;
  }

  async getBillingInfo(orgId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { orgId },
    });
    if (!subscription) {
      return { subscription: null, invoices: [] };
    }

    let invoices: {
      id: string;
      amount: number;
      currency: string;
      date: Date;
      status: string;
      pdf: string | null;
    }[] = [];
    if (this.stripe && subscription.stripeCustomerId) {
      try {
        const stripeInvoices = await this.stripe.invoices.list({
          customer: subscription.stripeCustomerId,
          limit: 10,
        });
        invoices = stripeInvoices.data.map((inv) => ({
          id: inv.id,
          amount: inv.amount_paid / 100,
          currency: inv.currency.toUpperCase(),
          date: new Date(inv.created * 1000),
          status: inv.status ?? 'unknown',
          pdf: inv.invoice_pdf ?? null,
        }));
      } catch {
        // stripe unavailable
      }
    }

    return { subscription, invoices };
  }

  async createPortalSession(orgId: string, returnUrl: string) {
    const stripe = this.getStripe();
    const subscription = await this.prisma.subscription.findUnique({
      where: { orgId },
    });
    if (!subscription) throw new NotFoundException('No subscription found');

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  }

  getLimits() {
    return PLAN_LIMITS;
  }
}
