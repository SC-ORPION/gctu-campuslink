import { prisma } from '../db';
import { z } from 'zod';

export const CreateHostelSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  campus: z.string().default('GCTU'),
  locationArea: z.string().min(2),
  distanceFromCampus: z.string().optional(),
  genderRule: z.enum(['MALE_ONLY', 'FEMALE_ONLY', 'MIXED']),
  coverImage: z.string().optional(),
});

export const CreateRoomSchema = z.object({
  buildingId: z.string().uuid(),
  roomNumber: z.string().min(1),
  capacity: z.number().int().positive(),
  genderRule: z.enum(['MALE_ONLY', 'FEMALE_ONLY', 'MIXED']),
  price: z.number().positive(),
});

export class HostelService {
  /**
   * Create a new hostel with validated payload fields.
   */
  static async createHostel(data: any) {
    const parsedData = CreateHostelSchema.parse(data);
    return await prisma.hostel.create({
      data: {
        name: parsedData.name,
        description: parsedData.description,
        campus: parsedData.campus,
        locationArea: parsedData.locationArea,
        distanceFromCampus: parsedData.distanceFromCampus,
        genderRule: parsedData.genderRule,
        coverImage: parsedData.coverImage || null,
        status: 'OPEN',
      },
    });
  }

  /**
   * Add image records with production image compression simulated URLs.
   */
  static async addHostelImage(hostelId: string, originalUrl: string, orderIndex: number = 0) {
    // Simulated production image generation
    const thumbnailUrl = `${originalUrl}?w=150&h=150&fit=crop`;
    const mediumUrl = `${originalUrl}?w=600&h=400&fit=crop`;

    return await prisma.hostelImage.create({
      data: {
        hostelId,
        imageUrl: originalUrl,
        thumbnailUrl,
        mediumUrl,
        orderIndex,
      },
    });
  }

  /**
   * Create a new building under a hostel.
   */
  static async createBuilding(hostelId: string, name: string, genderRule: 'MALE_ONLY' | 'FEMALE_ONLY' | 'MIXED') {
    return await prisma.building.create({
      data: {
        hostelId,
        name,
        genderRule,
      },
    });
  }

  /**
   * Create a room under a building with structural constraints validation.
   */
  static async createRoom(data: {
    buildingId: string;
    roomNumber: string;
    capacity: number;
    genderRule: 'MALE_ONLY' | 'FEMALE_ONLY' | 'MIXED';
    price: number;
  }) {
    const parsed = CreateRoomSchema.parse(data);

    return await prisma.room.create({
      data: {
        buildingId: parsed.buildingId,
        roomNumber: parsed.roomNumber,
        capacity: parsed.capacity,
        genderRule: parsed.genderRule,
        price: parsed.price,
        currentOccupancy: 0,
      },
    });
  }
}
export default HostelService;
