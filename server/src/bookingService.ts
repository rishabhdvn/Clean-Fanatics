import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const VALID_TRANSITIONS: any = {
  PENDING: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['CONFIRMED', 'PENDING', 'CANCELLED'], // PENDING = Rejection (Retry)
  CONFIRMED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'FAILED'],
  COMPLETED: [],
  CANCELLED: [],
  FAILED: ['PENDING'] // Admin retry
};

export const BookingService = {
  async create(service: string) {
    const booking = await prisma.booking.create({
      data: { service, status: 'PENDING' }
    });
    // Simulate finding a provider immediately
    this.simulateAutoAssign(booking.id);
    return booking;
  },

  async getAll() {
    return prisma.booking.findMany({ 
      include: { logs: { orderBy: { timestamp: 'desc' } } },
      orderBy: { updatedAt: 'desc' } 
    });
  },

  async updateStatus(id: string, newStatus: string, actor: string) {
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new Error("Booking not found");

    if (!VALID_TRANSITIONS[booking.status].includes(newStatus)) {
      throw new Error(`Invalid State Transition: ${booking.status} -> ${newStatus}`);
    }

    let providerUpdate = {};
    
    // Logic: If Provider Rejects (ASSIGNED -> PENDING), clear provider
    if (booking.status === 'ASSIGNED' && newStatus === 'PENDING') {
      providerUpdate = { provider: null };
    }
    // Logic: If transitioning to ASSIGNED, assign a provider
    if (newStatus === 'ASSIGNED') {
      providerUpdate = { provider: "Provider John" };
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { 
        status: newStatus, 
        ...providerUpdate,
        logs: {
          create: { action: "STATUS_CHANGE", details: `Changed from ${booking.status} to ${newStatus} by ${actor}` }
        }
      },
      include: { logs: true }
    });

    // Retry Logic: If rejected, try to find someone else
    if (booking.status === 'ASSIGNED' && newStatus === 'PENDING') {
      setTimeout(() => this.simulateAutoAssign(id), 2000); // Retry in 2s
    }

    return updated;
  },

  async simulateAutoAssign(bookingId: string) {
    console.log(`🤖 System: Looking for provider for ${bookingId}...`);
    setTimeout(async () => {
      try {
        await this.updateStatus(bookingId, 'ASSIGNED', 'SYSTEM_AUTO_MATCH');
        console.log(`✅ System: Provider assigned to ${bookingId}`);
      } catch (e) {
        console.log("Auto-assign skipped (likely cancelled already)");
      }
    }, 3000); // 3 second delay to simulate search
  }
};