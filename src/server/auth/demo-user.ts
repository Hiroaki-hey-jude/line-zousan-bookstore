import { prisma } from "@/lib/prisma";

export const ensureDemoUser = async () => {
  return prisma.user.upsert({
    where: { lineId: "demo-line-user" },
    update: {},
    create: {
      lineId: "demo-line-user",
      name: "像倉 花子",
      email: "demo@example.com",
    },
  });
};
