'use client';

import { useEffect, useState } from 'react';

interface CTASettings {
  scoreThreshold: number;
  shopify: {
    message: string;
    couponCode: string;
  };
  nonShopify: {
    message: string;
    link: string;
  };
}

const SettingsPage = () => {
  const [settings, setSettings] = useState<CTASettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/cta-settings?apiKey=' + process.env.NEXT_PUBLIC_API_KEY);
      const data = await response.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string, value: string | number) => {
    try {
      await fetch('/api/cta-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: String(value) }),
      });
      alert('Impostazione salvata con successo!');
    } catch (error) {
      console.error('Error saving setting:', error);
      alert('Errore nel salvataggio');
    }
  };

  if (loading) {
    return <div className="p-7">Caricamento...</div>;
  }

  if (!settings) {
    return <div className="p-7">Errore nel caricamento delle impostazioni</div>;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black dark:text-white">Impostazioni CTA</h1>
        <p className="text-sm text-bodydark">Configura i messaggi e le soglie per le Call-to-Action</p>
      </div>

      {/* Score Threshold */}
      <div className="mb-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
          <h3 className="font-medium text-black dark:text-white">📊 Soglia Score</h3>
        </div>
        <div className="p-7">
          <label className="mb-3 block text-sm font-medium text-black dark:text-white">
            Soglia Score per Mostrare CTA (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={settings.scoreThreshold}
            onChange={(e) => setSettings({ ...settings, scoreThreshold: parseInt(e.target.value) })}
            onBlur={(e) => handleSave('cta_score_threshold', e.target.value)}
            className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
          />
          <p className="mt-2 text-sm text-bodydark">
            Le CTA verranno mostrate solo se lo score dell&apos;audit è inferiore a questa soglia
          </p>
        </div>
      </div>

      {/* Shopify CTA */}
      <div className="mb-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
          <h3 className="font-medium text-black dark:text-white">🛍️ CTA Shopify</h3>
        </div>
        <div className="p-7 space-y-4">
          <div>
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Messaggio CTA
            </label>
            <textarea
              value={settings.shopify.message}
              onChange={(e) => setSettings({
                ...settings,
                shopify: { ...settings.shopify, message: e.target.value }
              })}
              onBlur={(e) => handleSave('shopify_cta_message', e.target.value)}
              rows={3}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            />
            <p className="mt-2 text-sm text-bodydark">
              Usa <code className="bg-gray-2 px-2 py-1 rounded">{'{coupon}'}</code> per inserire il codice coupon
            </p>
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Codice Coupon
            </label>
            <input
              type="text"
              value={settings.shopify.couponCode}
              onChange={(e) => setSettings({
                ...settings,
                shopify: { ...settings.shopify, couponCode: e.target.value }
              })}
              onBlur={(e) => handleSave('shopify_coupon_code', e.target.value)}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Non-Shopify CTA */}
      <div className="mb-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
          <h3 className="font-medium text-black dark:text-white">📊 CTA Non-Shopify</h3>
        </div>
        <div className="p-7 space-y-4">
          <div>
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Messaggio CTA
            </label>
            <textarea
              value={settings.nonShopify.message}
              onChange={(e) => setSettings({
                ...settings,
                nonShopify: { ...settings.nonShopify, message: e.target.value }
              })}
              onBlur={(e) => handleSave('non_shopify_cta_message', e.target.value)}
              rows={3}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Link Contatti
            </label>
            <input
              type="url"
              value={settings.nonShopify.link}
              onChange={(e) => setSettings({
                ...settings,
                nonShopify: { ...settings.nonShopify, link: e.target.value }
              })}
              onBlur={(e) => handleSave('non_shopify_cta_link', e.target.value)}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
          <h3 className="font-medium text-black dark:text-white">👁️ Anteprima</h3>
        </div>
        <div className="p-7">
          <div className="mb-4">
            <h4 className="mb-2 font-medium">CTA Shopify:</h4>
            <div className="rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 p-4 text-white">
              <div className="mb-2 text-sm font-semibold">🛍️ Migliora il tuo Tracking Shopify</div>
              <div className="mb-3 text-xs">
                {settings.shopify.message.replace('{coupon}', settings.shopify.couponCode)}
              </div>
              <button className="w-full rounded bg-white px-4 py-2 text-sm font-semibold text-purple-600">
                Scarica InnexData Gratis
              </button>
            </div>
          </div>

          <div>
            <h4 className="mb-2 font-medium">CTA Non-Shopify:</h4>
            <div className="rounded-lg bg-gradient-to-br from-pink-400 to-red-500 p-4 text-white">
              <div className="mb-2 text-sm font-semibold">📊 Ottimizza il Tuo Tracking</div>
              <div className="mb-3 text-xs">{settings.nonShopify.message}</div>
              <button className="w-full rounded bg-white px-4 py-2 text-sm font-semibold text-red-500">
                Contattaci Ora
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
