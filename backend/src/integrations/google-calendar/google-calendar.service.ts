/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { google } from 'googleapis';

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private createOAuthClient() {
    return new google.auth.OAuth2(
      this.config.get<string>('GOOGLE_CLIENT_ID'),
      this.config.get<string>('GOOGLE_CLIENT_SECRET'),
      this.config.get<string>('GOOGLE_REDIRECT_URI'),
    );
  }

  getAuthUrl(userId: string): string {
    const client = this.createOAuthClient();
    const state = Buffer.from(userId).toString('base64');
    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/calendar.events'],
      state,
    });
  }

  async handleCallback(code: string, state: string): Promise<string> {
    const userId = Buffer.from(state, 'base64').toString('utf8');
    const client = this.createOAuthClient();
    const { tokens } = await client.getToken(code);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: tokens.access_token ?? null,
        googleRefreshToken: tokens.refresh_token ?? null,
        googleCalendarConnected: true,
      },
    });

    const appUrl =
      this.config.get<string>('APP_URL') ?? 'http://localhost:5173';
    return `${appUrl}/my-place?gc=success`;
  }

  async disconnect(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: null,
        googleRefreshToken: null,
        googleCalendarConnected: false,
      },
    });
  }

  async getStatus(userId: string): Promise<{ connected: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { googleCalendarConnected: true },
    });
    return { connected: user?.googleCalendarConnected ?? false };
  }

  async syncAssignments(userId: string): Promise<{ synced: number }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        googleAccessToken: true,
        googleRefreshToken: true,
        googleCalendarConnected: true,
      },
    });

    if (!user?.googleCalendarConnected || !user.googleAccessToken) {
      throw new Error('Google Calendar not connected');
    }

    const client = this.createOAuthClient();
    client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken ?? undefined,
    });

    client.on('tokens', async (tokens: any) => {
      if (tokens.access_token) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { googleAccessToken: tokens.access_token as string },
        });
      }
    });

    const calendar = google.calendar({ version: 'v3', auth: client as any });

    const assignments = await this.prisma.assignment.findMany({
      where: { userId, status: 'ACTIVE', deletedAt: null },
      include: {
        workplace: true,
        shifts: { orderBy: { date: 'asc' } },
      },
    });

    let synced = 0;

    for (const assignment of assignments) {
      try {
        const summary = assignment.workplace.name;
        const location = assignment.workplace.location ?? undefined;
        const description = `Assignment at ${assignment.workplace.name}`;

        if (assignment.shifts.length > 0) {
          for (const shift of assignment.shifts) {
            await calendar.events.insert({
              calendarId: 'primary',
              requestBody: {
                summary,
                location,
                description,
                start: { dateTime: shift.startsAt.toISOString(), timeZone: 'UTC' },
                end: { dateTime: shift.endsAt.toISOString(), timeZone: 'UTC' },
              },
            });
            synced++;
          }
        } else {
          const startDate = assignment.startsAt.toISOString().split('T')[0];
          const endDate = (assignment.endsAt ?? assignment.startsAt)
            .toISOString()
            .split('T')[0];
          await calendar.events.insert({
            calendarId: 'primary',
            requestBody: {
              summary,
              location,
              description,
              start: { date: startDate },
              end: { date: endDate },
            },
          });
          synced++;
        }
      } catch (err) {
        this.logger.warn(`Failed to sync assignment ${assignment.id}: ${String(err)}`);
      }
    }

    return { synced };
  }
}
