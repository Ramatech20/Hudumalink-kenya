/**
 * Mock Delivery Service for HudumaLink Kenya
 * In a real application, this would integrate with APIs like Sendy, G4S, or Wells Fargo.
 */

export interface DeliveryQuote {
  provider: string;
  price: number;
  estimatedDays: string;
  trackingAvailable: boolean;
}

export const getDeliveryQuotes = async (from: string, to: string, weight: number): Promise<DeliveryQuote[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock logic for quotes based on distance (simplified)
  const isSameCounty = from === to;
  
  return [
    {
      provider: 'HudumaLink Express',
      price: isSameCounty ? 250 : 450,
      estimatedDays: isSameCounty ? 'Same Day' : '1-2 Days',
      trackingAvailable: true
    },
    {
      provider: 'Sendy',
      price: isSameCounty ? 300 : 550,
      estimatedDays: isSameCounty ? '2-4 Hours' : '1 Day',
      trackingAvailable: true
    },
    {
      provider: 'G4S Courier',
      price: isSameCounty ? 400 : 600,
      estimatedDays: '1-2 Days',
      trackingAvailable: true
    }
  ];
};

export const trackPackage = async (trackingId: string) => {
  // Mock tracking status
  const statuses = ['Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'];
  return {
    id: trackingId,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    lastUpdate: new Date().toISOString()
  };
};
