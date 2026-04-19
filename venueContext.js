/**
 * ARIA — Venue Context Engine
 * Single source of truth for all static venue metadata.
 * Used by both the AI system prompt and the Maps routing engine.
 */

const venueContext = {
  metadata: {
    name: 'Wembley Stadium',
    capacity: 90000,
    city: 'London, UK',
    currentEvent: {
      name: 'Premier League Final 2026',
      startTime: '15:00',
      endTime: '17:00',
      status: 'Live'
    }
  },
  gates: {
    gate_1: { label: 'Gate 1 North Entry', accessibility: true, status: 'Open', lat: 51.5570, lng: -0.2796 },
    gate_2: { label: 'Gate 2 South Entry', accessibility: true, status: 'Open', lat: 51.5548, lng: -0.2801 },
    gate_3: { label: 'Gate 3 East Entry',  accessibility: false, status: 'Congested', lat: 51.5560, lng: -0.2775 },
    gate_4: { label: 'Gate 4 West Exit',   accessibility: true, status: 'Open', lat: 51.5560, lng: -0.2820 }
  },
  stands: {
    north: { sections: ['N1', 'N2', 'N3'], capacity: 22000, type: 'General Admission' },
    south: { sections: ['S1', 'S2', 'S3'], capacity: 22000, type: 'General Admission' },
    east:  { sections: ['E1', 'E2'],       capacity: 20000, type: 'VIP & Press' },
    west:  { sections: ['W1', 'W2'],       capacity: 26000, type: 'Premium Seating' }
  },
  foodStalls: {
    food_north: { label: 'North Stand Concessions', cuisine: 'Mixed', status: 'Open', queueTime: '8 mins', lat: 51.5568, lng: -0.2788 },
    food_south: { label: 'South Stand Concessions', cuisine: 'Mixed', status: 'Open', queueTime: '5 mins', lat: 51.5545, lng: -0.2795 }
  },
  utilities: {
    toilets_east: { label: 'East Wing Washrooms', status: 'Clean', lat: 51.5559, lng: -0.2779 },
    toilets_west: { label: 'West Wing Washrooms', status: 'Clean', lat: 51.5559, lng: -0.2815 }
  },
  emergency: {
    medic_centre: { label: 'Medical Centre', status: 'Standby', lat: 51.5555, lng: -0.2805 },
    security_posts: ['Gate 1 Security', 'Gate 3 Security', 'West Concourse Security']
  },
  vip: {
    vip_lounge: { label: 'VIP Hospitality Lounge', status: 'Open', lat: 51.5562, lng: -0.2792 }
  }
};

module.exports = venueContext;
