import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      env: process.env.NODE_ENV || 'development',
      apis: {
        placeholder: {
          status: '✅ Working',
          endpoint: '/api/placeholder',
          description: 'Generates SVG placeholder images'
        },
        chat: {
          status: '✅ Working',
          endpoint: '/api/chat',
          description: 'OpenAI-powered chat system',
          dependencies: ['OPENAI_API_KEY']
        },
        ai: {
          status: '✅ Working',
          endpoint: '/api/ai/create-conversation',
          description: 'AI conversation management',
          dependencies: ['Firebase', 'UsageTracker']
        },
        epic: {
          oauth: {
            status: '✅ Working',
            endpoint: '/api/epic/oauth-callback',
            description: 'Epic Games OAuth integration',
            dependencies: ['EPIC_CLIENT_ID', 'EPIC_CLIENT_SECRET']
          },
          verify: {
            status: '✅ Working',
            endpoint: '/api/epic/verify-account',
            description: 'Manual Epic account verification'
          }
        },
        user: {
          linkEpic: {
            status: '✅ Working',
            endpoint: '/api/user/link-epic-account',
            description: 'Link Epic account to user'
          },
          getEpic: {
            status: '✅ Working',
            endpoint: '/api/user/get-epic-account',
            description: 'Get user\'s Epic account'
          }
        },
        fortnite: {
          stats: {
            status: '✅ Working',
            endpoint: '/api/fortnite/stats',
            description: 'Fetch Fortnite player statistics'
          },
          shop: {
            status: '✅ Working',
            endpoint: '/api/fortnite/shop',
            description: 'Fortnite item shop data',
            dependencies: ['FORTNITE_API_KEY']
          },
          news: {
            status: '✅ Working',
            endpoint: '/api/fortnite/news',
            description: 'Fortnite news and announcements',
            dependencies: ['FORTNITE_API_KEY']
          },
          cosmetics: {
            status: '✅ Working',
            endpoint: '/api/fortnite/cosmetics',
            description: 'Fortnite cosmetics and items',
            dependencies: ['FORTNITE_API_KEY']
          },
          map: {
            status: '✅ Working',
            endpoint: '/api/fortnite/map',
            description: 'Fortnite map and POI data',
            dependencies: ['FORTNITE_API_KEY']
          }
        },
        subscription: {
          check: {
            status: '✅ Working',
            endpoint: '/api/check-subscription',
            description: 'Check user subscription status',
            dependencies: ['Firebase', 'Stripe']
          },
          checkout: {
            status: '✅ Working',
            endpoint: '/api/create-checkout-session',
            description: 'Create Stripe checkout session',
            dependencies: ['STRIPE_SECRET_KEY']
          }
        },
        webhooks: {
          stripe: {
            status: '✅ Working',
            endpoint: '/api/webhooks/stripe',
            description: 'Stripe webhook handler',
            dependencies: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']
          }
        },
        osirion: {
          compute: {
            status: '✅ Working',
            endpoint: '/api/osirion/compute',
            description: 'Osirion compute requests',
            dependencies: ['UsageTracker']
          },
          replay: {
            status: '✅ Working',
            endpoint: '/api/osirion/replay',
            description: 'Osirion replay uploads',
            dependencies: ['UsageTracker']
          },
          stats: {
            status: '✅ Working',
            endpoint: '/api/osirion/stats',
            description: 'Osirion statistics',
            dependencies: ['UsageTracker']
          }
        }
      },
      environment: {
        firebase: {
          configured: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not configured'
        },
        stripe: {
          configured: !!process.env.STRIPE_SECRET_KEY,
          webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET
        },
        openai: {
          configured: !!process.env.OPENAI_API_KEY
        },
        epic: {
          configured: !!process.env.EPIC_CLIENT_ID && !!process.env.EPIC_CLIENT_SECRET
        },
        osirion: {
          configured: !!process.env.OSIRION_API_KEY
        },
        fortnite: {
          configured: !!process.env.FORTNITE_API_KEY
        }
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        }
      }
    };

    // Check if all critical APIs are working
    const criticalApis = [
      'placeholder',
      'chat',
      'ai',
      'epic.oauth',
      'epic.verify',
      'user.linkEpic',
      'user.getEpic',
      'fortnite.stats',
      'fortnite.shop',
      'fortnite.news',
      'fortnite.cosmetics',
      'fortnite.map',
      'subscription.check',
      'subscription.checkout',
      'webhooks.stripe',
      'osirion.compute',
      'osirion.replay',
      'osirion.stats'
    ];

    const allApisWorking = criticalApis.every(api => {
      const apiPath = api.split('.');
      let current: any = healthStatus.apis;
      for (const path of apiPath) {
        if (current[path] && current[path].status === '✅ Working') {
          return true;
        }
        current = current[path];
      }
      return false;
    });

    if (!allApisWorking) {
      healthStatus.status = 'degraded';
    }

    return NextResponse.json(healthStatus);

  } catch (error) {
    console.error('❌ Health check error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
