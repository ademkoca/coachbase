import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useUpdateTrainer } from "../hooks/useTrainer";

export default function SettingsPage() {
  const trainer = useAuthStore((s) => s.trainer);
  const update = useUpdateTrainer();

  const [displayName, setDisplayName] = useState(trainer?.displayName ?? "");
  const [phone, setPhone] = useState(trainer?.phone ?? "");
  const [bio, setBio] = useState(trainer?.bio ?? "");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">(
    trainer?.weightUnit ?? "kg",
  );
  const [measurementUnit, setMeasurementUnit] = useState<"cm" | "in">(
    trainer?.measurementUnit ?? "cm",
  );
  const [feePerSession, setFeePerSession] = useState(
    trainer?.feePerSession ?? "",
  );
  const [feeMonthly, setFeeMonthly] = useState(trainer?.feeMonthly ?? "");
  const [feeHalfYearly, setFeeHalfYearly] = useState(
    trainer?.feeHalfYearly ?? "",
  );
  const [feeYearly, setFeeYearly] = useState(trainer?.feeYearly ?? "");
  const [staleClientThresholdDays, setStaleClientThresholdDays] = useState(
    String(trainer?.staleClientThresholdDays ?? 14),
  );
  const [currency, setCurrency] = useState<"USD" | "EUR" | "RSD">(
    trainer?.currency ?? "USD",
  );
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await update.mutateAsync({
      displayName,
      phone: phone || undefined,
      bio: bio || undefined,
      weightUnit,
      measurementUnit,
      feePerSession: feePerSession || undefined,
      feeMonthly: feeMonthly || undefined,
      feeHalfYearly: feeHalfYearly || undefined,
      feeYearly: feeYearly || undefined,
      staleClientThresholdDays: Math.max(
        1,
        Number(staleClientThresholdDays) || 14,
      ),
      currency,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile section */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-800">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Display name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={trainer?.email ?? ""}
                disabled
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-400">
                Email is managed by your sign-in account and cannot be changed
                here.
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Phone number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Optional"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A short description about you (optional)"
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Preferences section */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-800">
            Measurement preferences
          </h2>
          <p className="mb-4 text-sm text-gray-500">
            These units are used on client progress forms and charts.
          </p>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Weight unit
              </label>
              <div className="flex gap-2">
                {(["kg", "lbs"] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setWeightUnit(u)}
                    className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                      weightUnit === u
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-gray-300 text-gray-600 hover:border-gray-400"
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Measurement unit
              </label>
              <div className="flex gap-2">
                {(["cm", "in"] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setMeasurementUnit(u)}
                    className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                      measurementUnit === u
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-gray-300 text-gray-600 hover:border-gray-400"
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Default fees section */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-1 font-semibold text-gray-800">Default fees</h2>
          <p className="mb-4 text-sm text-gray-500">
            Pre-filled when adding a payment record. You can still change the
            amount per record.
          </p>
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Currency
            </label>
            <div className="flex gap-2">
              {(["USD", "EUR", "RSD"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                    currency === c
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-gray-300 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {(
              [
                {
                  label: "Per session",
                  value: feePerSession,
                  set: setFeePerSession,
                },
                { label: "Monthly", value: feeMonthly, set: setFeeMonthly },
                {
                  label: "Half-yearly",
                  value: feeHalfYearly,
                  set: setFeeHalfYearly,
                },
                { label: "Yearly", value: feeYearly, set: setFeeYearly },
              ] as const
            ).map(({ label, value, set }) => (
              <div key={label}>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {label}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Client monitoring section */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-1 font-semibold text-gray-800">
            Client monitoring
          </h2>
          <p className="mb-4 text-sm text-gray-500">
            Flag clients on the dashboard when they haven't had a session
            scheduled within this many days.
          </p>
          <div className="w-32">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Stale threshold (days)
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={staleClientThresholdDays}
              onChange={(e) => setStaleClientThresholdDays(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={update.isPending}
            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {update.isPending ? "Saving..." : "Save changes"}
          </button>
          {saved && (
            <span className="text-sm text-green-600">Changes saved!</span>
          )}
        </div>
      </form>
    </div>
  );
}
