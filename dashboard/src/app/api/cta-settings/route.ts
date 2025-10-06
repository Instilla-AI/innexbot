import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('apiKey');
    
    // Verifica API key
    if (!apiKey || apiKey !== process.env.API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Recupera settings dal database
    const result = await pool.query(
      `SELECT key, value FROM settings WHERE key IN (
        'cta_score_threshold',
        'shopify_cta_message',
        'shopify_coupon_code',
        'non_shopify_cta_message',
        'non_shopify_cta_link'
      )`
    );

    // Converti in oggetto
    const settings: Record<string, string> = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });

    // Default values se non presenti
    const config = {
      scoreThreshold: parseInt(settings.cta_score_threshold || '70'),
      shopify: {
        message: settings.shopify_cta_message || 'Scarica gratuitamente InnexData ed usa il coupon sconto {coupon}',
        couponCode: settings.shopify_coupon_code || 'INNEX2024'
      },
      nonShopify: {
        message: settings.non_shopify_cta_message || 'Il tuo tracking ha bisogno di ottimizzazione. Contattaci per una consulenza gratuita!',
        link: settings.non_shopify_cta_link || 'https://innexdata.com/contatti'
      }
    };

    return NextResponse.json({ 
      success: true,
      settings: config
    });
  } catch (error) {
    console.error('[API CTA Settings] Error:', error);
    
    // Ritorna default settings in caso di errore
    return NextResponse.json({ 
      success: true,
      settings: {
        scoreThreshold: 70,
        shopify: {
          message: 'Scarica gratuitamente InnexData ed usa il coupon sconto {coupon}',
          couponCode: 'INNEX2024'
        },
        nonShopify: {
          message: 'Il tuo tracking ha bisogno di ottimizzazione. Contattaci per una consulenza gratuita!',
          link: 'https://innexdata.com/contatti'
        }
      }
    });
  }
}

// Update settings
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { key, value } = body;
    
    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Missing key or value' }, { status: 400 });
    }

    // Verifica che la key sia valida
    const validKeys = [
      'cta_score_threshold',
      'shopify_cta_message',
      'shopify_coupon_code',
      'non_shopify_cta_message',
      'non_shopify_cta_link'
    ];

    if (!validKeys.includes(key)) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
    }

    // Update o insert
    await pool.query(
      `INSERT INTO settings (key, value, updated_at) 
       VALUES ($1, $2, NOW()) 
       ON CONFLICT (key) 
       DO UPDATE SET value = $2, updated_at = NOW()`,
      [key, value]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API CTA Settings] Error updating:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
