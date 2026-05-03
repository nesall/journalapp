import { type Note } from './types';

export const testData = {
  notes: [

    {
      id: '1',
      topic_id: '1',
      title: 'Note 1',
      body: 'In the year 2147, humanity had achieved the unthinkable—interstellar travel. Among the stars, the crew of the starship Artemis embarked on a mission to explore the uncharted Exarion Cluster, a distant galaxy shrouded in mystery.',
      mood: 3,
      created_at: '2024-05-15T22:01:55Z',
      updated_at: '2024-05-15T22:01:55Z',
      media: [
        {
          id: 'm1',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c3BhY2V8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60'
        },
        {
          id: 'm2',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c3BhY2V8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60'
        }
      ]
    },
    {
      id: '2', 
      topic_id: '1',
      title: 'Note 2',
      body: 'Captain Elise Nova, a seasoned explorer with a thirst for discovery, led the diverse crew of scientists, engineers, and adventurers. As they neared the cluster, their sensors picked up an anomaly—a massive, dormant spacecraft of unknown origin, floating silently in the void.',
      mood: null,
      created_at: '2024-05-17T22:01:55Z',
      updated_at: '2024-05-17T22:01:55Z',
      media: [
        {
          id: 'm3',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c3BhY2V8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60'
        },
        {
          id: 'm4',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c3BhY2V8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60'
        },
        {
          id: 'm5',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c3BhY2V8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60'
        }
      ]
    },
    {
      id: '3',
      topic_id: '1',
      title: 'Note 3',
      body: 'Captain Elise Nova, a seasoned explorer with a thirst for discovery, led the diverse crew of scientists, engineers, and adventurers. As they neared the cluster, their sensors picked up an anomaly—a massive, dormant spacecraft of unknown origin, floating silently in the void.',
      mood: 4,
      created_at: '2024-05-19T22:01:55Z',
      updated_at: '2024-05-19T22:01:55Z',
      media: []
    }

  ] as Note[]
};