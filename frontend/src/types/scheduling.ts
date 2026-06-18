export interface ProviderSlot {
  start: string;
  end: string;
  appointmentTypes: string[];
  blockType: string;
}

export interface ProviderAvailability {
  providerId: string;
  name: string;
  specialty: string;
  facility: string;
  slots: ProviderSlot[];
}

export interface RoomSlot {
  start: string;
  end: string;
  status: 'open' | 'held' | 'booked';
}

export interface RoomAvailability {
  roomId: string;
  name: string;
  facility: string;
  capabilities: string[];
  slots: RoomSlot[];
}

export interface DemoConstraints {
  tuesdayOrNoPacu: {
    description: string;
    orSlot: string;
    pacuAvailable: boolean;
    inpatientBedAvailable: boolean;
    recommendedAlternative: string;
  };
}

export interface ProviderAvailabilityFile {
  providers: ProviderAvailability[];
}

export interface RoomAvailabilityFile {
  rooms: RoomAvailability[];
  demoConstraints: DemoConstraints;
}

export interface DependencyImpact {
  stepId: number;
  stepName: string;
  impact: 'unblocks' | 'blocked';
  note: string;
}

export interface BookedSlot {
  roomId: string;
  roomName: string;
  start: string;
  end: string;
  patientId: string;
  patientName: string;
}

export interface AdditionalOrderFile {
  patientId: string;
  triggerLabel: string;
  placedBy: string | null;
  placedAt: string | null;
  reason: string;
  order: import('./patient').ClinicalOrder | null;
  dependencyImpact: DependencyImpact[];
}
