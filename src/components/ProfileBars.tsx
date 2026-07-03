import { useI18n } from '@/i18n/I18nProvider';
import { dimensionOrder, dimensions } from '@/data/content';
import { groupColor } from '@/features/visualisations/palette';

/**
 * Compact 15-dimension bar strip (used in the atlas detail view and ML Lab
 * feature-vector section). Fully accessible: every bar carries a label with
 * the dimension name and value.
 */
export function ProfileBars({ vector, height = 64 }: { vector: number[]; height?: number }) {
  const { t } = useI18n();
  return (
    <div className="flex items-end gap-1" style={{ height }} role="img" aria-label={
      dimensionOrder.map((id, i) => `${t(`dimensions.${id}.name`)}: ${Math.round(vector[i])}`).join(', ')
    }>
      {dimensionOrder.map((id, i) => {
        const group = dimensions.find((d) => d.id === id)!.group;
        return (
          <div
            key={id}
            className="group relative flex-1 rounded-t"
            style={{
              height: `${8 + (vector[i] / 100) * 88}%`,
              background: groupColor(group),
              opacity: 0.75,
              minWidth: 5,
            }}
            title={`${t(`dimensions.${id}.name`)}: ${Math.round(vector[i])}`}
          />
        );
      })}
    </div>
  );
}
