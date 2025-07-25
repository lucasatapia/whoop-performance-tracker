import React, { useState, useEffect, useMemo } from 'react';
import {
  Platform,
  View,
  Pressable,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Card from '@/ui/Card';
import { getExerciseStatsHistory } from '@/lib/db.native';
import { EXERCISES } from '@/constants/exercises';
import { theme } from '@/theme';
import { chartTheme } from '@/lib/chartTheme';

/* ───────── responsive helpers ───────── */
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CHART_H = Math.min(420, Math.round(SCREEN_H * 0.45));

/* ───────── Victory (web vs native) ───────── */
const Victory =
  Platform.OS === 'web' ? require('victory') : require('victory-native');

const {
  VictoryChart,
  VictoryLine,
  VictoryAxis,
  VictoryScatter,
  VictoryLabel,
  VictoryTooltip,
} = Victory;

/* ───────── time-frame buttons ───────── */
const TIMEFRAMES = [
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '6M', days: 180 },
];

/* ══════════════════════════════════════ */
export default function ProgressTab() {
  const [exercise, setExercise] = useState(EXERCISES[0]);
  const [periodDays, setPeriodDays] = useState(7);
  const [rawData, setRawData] = useState<{ x: Date; y: number }[]>([]);

  /* ───────── fetch history ───────── */
  useEffect(() => {
    let canceled = false;
    (async () => {
      const end = new Date();
      const start = new Date(end);
      start.setDate(end.getDate() - periodDays);

      const hist = await getExerciseStatsHistory(
        exercise,
        start.toISOString(),
        end.toISOString()
      );

      if (!canceled) {
        setRawData(
          hist.map(h => ({
            x: new Date(h.date),
            y: Math.round(h.topWeight * (1 + h.reps / 30)), // est-1RM
          }))
        );
      }
    })();
    return () => {
      canceled = true;
    };
  }, [exercise, periodDays]);

  /* ───────── bucket by month when >30 d ───────── */
  const data = useMemo(() => {
    if (periodDays > 30) {
      const byMonth = new Map<string, number[]>();
      rawData.forEach(({ x, y }) => {
        const key = `${x.getFullYear()}-${x.getMonth()}`;
        if (!byMonth.has(key)) byMonth.set(key, []);
        byMonth.get(key)!.push(y);
      });
      return Array.from(byMonth.entries())
        .map(([k, ys]) => {
          const [yr, mo] = k.split('-').map(Number);
          return {
            x: new Date(yr, mo, 1),
            y: Math.round(ys.reduce((a, b) => a + b, 0) / ys.length),
          };
        })
        .sort((a, b) => a.x.getTime() - b.x.getTime());
    }
    return rawData;
  }, [rawData, periodDays]);

  const hasRealData = data.length > 0;

  /* ───────── stats & domain helpers ───────── */
  const yMax = useMemo(() => {
    if (!hasRealData) return 5;
    const max = Math.max(...data.map(d => d.y));
    return max === 0 ? 5 : max + 5; // pad so a single point isn’t flat
  }, [data, hasRealData]);

  const avgY = useMemo(
    () => (hasRealData ? data.reduce((s, d) => s + d.y, 0) / data.length : 0),
    [data, hasRealData]
  );

  /* ───────── x-axis ticks (always computed) ───────── */
  const { tickValues, tickFormat } = useMemo(() => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - periodDays);

    if (periodDays <= 7) {
      const days: Date[] = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1))
        days.push(new Date(d));
      return {
        tickValues: days,
        tickFormat: (t: Date) =>
          `${t.toLocaleDateString('en-US', { weekday: 'short' })} ${t.getDate()}`,
      };
    }

    if (periodDays <= 30) {
      const ticks: Date[] = [];
      const anchor = new Date(end);
      anchor.setDate(end.getDate() - 28);
      for (let i = 0; i < 5; i++) {
        const d = new Date(anchor);
        d.setDate(anchor.getDate() + i * 7);
        ticks.push(d);
      }
      return {
        tickValues: ticks,
        tickFormat: (t: Date) =>
          t.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      };
    }

    const months: Date[] = [];
    const mStart = new Date(start.getFullYear(), start.getMonth(), 1);
    for (let m = new Date(mStart); m <= end; m.setMonth(m.getMonth() + 1))
      months.push(new Date(m));
    return {
      tickValues: months,
      tickFormat: (t: Date) =>
        t.toLocaleDateString('en-US', { month: 'short' }),
    };
  }, [periodDays]);

  const showTooltip = periodDays === 30;

  /* ───────── ensure Victory always has some data ───────── */
  const endDate = tickValues[tickValues.length - 1] ?? new Date();
  const startDate = tickValues[0] ?? new Date(endDate);
  const resolvedData = hasRealData
    ? data
    : [
        { x: startDate, y: 0 },
        { x: endDate, y: 0 },
      ];

  /* ───────── UI ───────── */
  return (
    <View style={styles.container}>
      {/* controls */}
      <Card>
        <Picker
          selectedValue={exercise}
          onValueChange={setExercise}
          style={styles.picker}
        >
          {EXERCISES.map(e => (
            <Picker.Item key={e} label={e} value={e} />
          ))}
        </Picker>

        <View style={styles.buttonRow}>
          {TIMEFRAMES.map(({ label, days }) => (
            <Pressable
              key={label}
              onPress={() => setPeriodDays(days)}
              style={[
                styles.button,
                periodDays === days && styles.buttonActive,
              ]}
            >
              <Text
                style={[
                  styles.buttonText,
                  periodDays === days && styles.buttonTextActive,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      {/* chart */}
      <Card style={styles.chartCard}>
        {hasRealData && (
          <Text style={styles.avgText}>
            Average 1-RM:{' '}
            <Text style={{ fontWeight: 'bold' }}>{avgY.toFixed(0)}</Text> lbs
          </Text>
        )}

        {!hasRealData && (
          <Text style={styles.placeholder}>Log a workout to see progress!</Text>
        )}

        <VictoryChart
          height={CHART_H}
          width={SCREEN_W - 32}
          domainPadding={{ x: 20, y: [10, 20] }}
          domain={{ y: [0, yMax] }}
          scale={{ x: 'time' }}
          theme={chartTheme}
          padding={{ top: 48, right: 20, bottom: 40, left: 30 }}
        >
          <VictoryAxis
            tickValues={tickValues}
            tickFormat={tickFormat}
            style={{
              axis: { stroke: theme.colors.muted },
              tickLabels: { fill: theme.colors.text, fontSize: 10, padding: 5 },
              grid: { stroke: 'transparent' },
            }}
          />
          <VictoryAxis
            dependentAxis
            style={{
              axis: { stroke: 'transparent' },
              tickLabels: { fill: 'transparent' },
              grid: { stroke: theme.colors.card },
            }}
          />

          <VictoryLine
            data={resolvedData}
            interpolation="monotoneX"
            style={{
              data: {
                stroke: hasRealData ? theme.colors.accent : 'transparent',
                strokeWidth: 2,
              },
            }}
          />

          {/* points */}
          {periodDays <= 30 && hasRealData && (
            <VictoryScatter
              data={data}
              size={periodDays === 30 ? 3 : 4}
              labels={
                periodDays === 7
                  ? ({ datum }: any) => datum.y.toString()
                  : showTooltip
                  ? ({ datum }: any) => `${datum.y} lbs`
                  : undefined
              }
              labelComponent={
                periodDays === 7 ? (
                  <VictoryLabel
                    dy={-14}
                    style={{ fill: theme.colors.accent, fontSize: 12 }}
                  />
                ) : showTooltip ? (
                  <VictoryTooltip
                    pointerLength={4}
                    flyoutStyle={{
                      fill: theme.colors.card,
                      stroke: theme.colors.accent,
                    }}
                    style={{ fill: theme.colors.text, fontSize: 12 }}
                  />
                ) : undefined
              }
              style={{ data: { fill: theme.colors.accent } }}
            />
          )}

          {/* AVG dashed line */}
          {hasRealData && (
            <VictoryLine
              data={[
                { x: tickValues[0], y: avgY, label: 'AVG.' },
                { x: tickValues[tickValues.length - 1], y: avgY },
              ]}
              interpolation="linear"
              labels={({ datum }) => datum.label}
              labelComponent={
                <VictoryLabel
                  textAnchor="start"
                  dy={12}
                  dx={-20}
                  style={{
                    fill: theme.colors.text,
                    fontSize: 10,
                    fontWeight: 'bold',
                  }}
                />
              }
              style={{
                data: {
                  stroke: '#ffffff',
                  strokeWidth: 1,
                  strokeDasharray: '5,5',
                  opacity: 0.6,
                },
              }}
            />
          )}
        </VictoryChart>
      </Card>
    </View>
  );
}

/* ───────── styles ───────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing(4),
    backgroundColor: theme.colors.bg,
  },
  picker: {
    color: theme.colors.text,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.muted,
    borderRadius: 6,
    height: 40,
    paddingHorizontal: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  buttonRow: { flexDirection: 'row' },
  button: {
    flex: 1,
    paddingVertical: theme.spacing(2),
    marginHorizontal: theme.spacing(1),
    borderRadius: theme.spacing(1),
    borderWidth: 1,
    borderColor: theme.colors.accent,
    alignItems: 'center',
  },
  buttonActive: { backgroundColor: theme.colors.accent },
  buttonText: { color: theme.colors.accent, fontFamily: theme.fonts.body },
  buttonTextActive: { color: theme.colors.card },
  chartCard: {
    flex: 1,
    marginTop: theme.spacing(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  avgText: {
    color: theme.colors.text,
    marginBottom: theme.spacing(1),
    fontSize: 12,
  },
  placeholder: {
    position: 'absolute',
    top: CHART_H / 2 - 10,
    textAlign: 'center',
    width: '100%',
    color: theme.colors.muted,
    fontSize: 14,
  },
});
