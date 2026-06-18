import manifest from '@mock-data/manifest.json';
import mariaOrders from '@mock-data/compass-upload/maria-chen/existing-orders.json';
import mariaSymptoms from '@mock-data/compass-upload/maria-chen/existing-symptoms.json';
import robertOrders from '@mock-data/compass-upload/robert-tan/existing-orders.json';
import robertSymptoms from '@mock-data/compass-upload/robert-tan/existing-symptoms.json';
import jamesOrders from '@mock-data/compass-upload/james-miller/existing-orders.json';
import jamesSymptoms from '@mock-data/compass-upload/james-miller/existing-symptoms.json';
import anyaOrders from '@mock-data/compass-upload/anya-patel/existing-orders.json';
import anyaSymptoms from '@mock-data/compass-upload/anya-patel/existing-symptoms.json';
import davidOrders from '@mock-data/compass-upload/david-williams/existing-orders.json';
import davidSymptoms from '@mock-data/compass-upload/david-williams/existing-symptoms.json';
import sofiaOrders from '@mock-data/compass-upload/sofia-nguyen/existing-orders.json';
import sofiaSymptoms from '@mock-data/compass-upload/sofia-nguyen/existing-symptoms.json';
import providerAvailability from '@mock-data/scheduling/provider-availability.json';
import roomAvailability from '@mock-data/scheduling/room-availability.json';
import mariaAddon from '@mock-data/scheduling/additional-orders/maria-chen-cardiology-clearance.json';
import robertAddon from '@mock-data/scheduling/additional-orders/robert-tan-anticoag-bridge.json';
import jamesAddon from '@mock-data/scheduling/additional-orders/james-miller-none.json';
import anyaAddon from '@mock-data/scheduling/additional-orders/anya-patel-none.json';
import davidAddon from '@mock-data/scheduling/additional-orders/david-williams-none.json';
import sofiaAddon from '@mock-data/scheduling/additional-orders/sofia-nguyen-anesthesia-bundle.json';

import type { CompassManifest } from '../types/compass';
import type {
  ExistingOrdersBundle,
  ExistingSymptomsBundle,
  QueuePatient,
} from '../types/patient';
import type {
  AdditionalOrderFile,
  ProviderAvailabilityFile,
  RoomAvailabilityFile,
} from '../types/scheduling';

const ordersMap: Record<string, ExistingOrdersBundle> = {
  'maria-chen': mariaOrders as ExistingOrdersBundle,
  'robert-tan': robertOrders as ExistingOrdersBundle,
  'james-miller': jamesOrders as ExistingOrdersBundle,
  'anya-patel': anyaOrders as ExistingOrdersBundle,
  'david-williams': davidOrders as ExistingOrdersBundle,
  'sofia-nguyen': sofiaOrders as ExistingOrdersBundle,
};

const symptomsMap: Record<string, ExistingSymptomsBundle> = {
  'maria-chen': mariaSymptoms as ExistingSymptomsBundle,
  'robert-tan': robertSymptoms as ExistingSymptomsBundle,
  'james-miller': jamesSymptoms as ExistingSymptomsBundle,
  'anya-patel': anyaSymptoms as ExistingSymptomsBundle,
  'david-williams': davidSymptoms as ExistingSymptomsBundle,
  'sofia-nguyen': sofiaSymptoms as ExistingSymptomsBundle,
};

const addonMap: Record<string, AdditionalOrderFile> = {
  'maria-chen': mariaAddon as AdditionalOrderFile,
  'robert-tan': robertAddon as AdditionalOrderFile,
  'james-miller': jamesAddon as AdditionalOrderFile,
  'anya-patel': anyaAddon as AdditionalOrderFile,
  'david-williams': davidAddon as AdditionalOrderFile,
  'sofia-nguyen': sofiaAddon as AdditionalOrderFile,
};

export function getManifest(): CompassManifest {
  return manifest as CompassManifest;
}

export function buildInitialQueue(): QueuePatient[] {
  const m = getManifest();
  return Object.entries(m.patients).map(([patientId, meta]) => {
    const ordersBundle = ordersMap[patientId];
    const symptomsBundle = symptomsMap[patientId];
    return {
      patientId,
      displayName: meta.displayName,
      mrn: meta.mrn,
      status: 'Pending Review',
      urgent: false,
      ordersBundle,
      symptomsBundle,
      addonOrders: [],
      pathReadiness: null,
    };
  });
}

export function getProviderAvailability(): ProviderAvailabilityFile {
  return providerAvailability as ProviderAvailabilityFile;
}

export function getRoomAvailability(): RoomAvailabilityFile {
  return roomAvailability as RoomAvailabilityFile;
}

export function getAdditionalOrderFile(patientId: string): AdditionalOrderFile {
  return addonMap[patientId];
}

export function getCompassUploadPaths(patientId: string) {
  return getManifest().patients[patientId]?.compassUploads;
}
