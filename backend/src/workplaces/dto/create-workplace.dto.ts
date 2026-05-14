import { z } from 'zod';

export const createWorkplaceSchema = z.object({
  orgId: z.string().min(1),
  code: z.string().trim().min(1),
  name: z.string().min(1),
  location: z.string().min(1).optional(),
  isActive: z.boolean().default(true),

  // 🎨 Новый параметр — цвет рабочего места
  // Может быть HEX (#FF0000) или строка (red / blue)
  color: z.string().min(1).optional(),
});

export type CreateWorkplaceDto = z.infer<typeof createWorkplaceSchema>;
