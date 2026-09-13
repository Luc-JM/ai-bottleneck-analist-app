/**
 * AI-Bottleneck Analist - Local Process Mining Parser & Aggregator
 * 100% Vanilla JavaScript - No external frameworks - Local browser execution
 * Features: Dark/Light Mode, CSV Export, Activity Search, Chart.js Visualization, History Manager
 */

(function () {
  'use strict';

  // Constants
  const STORAGE_KEY_CURRENT = 'ai_bottleneck_summary_v1';
  const STORAGE_KEY_HISTORY = 'ai_bottleneck_history_v1';
  const STORAGE_KEY_THEME = 'ai_bottleneck_theme';

  // State
  let currentSummary = null;
  let isProcessing = false;
  let chartInstance = null;
  let activeSearchTerm = '';

  // DOM Elements - Core UI
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const selectFileBtn = document.getElementById('selectFileBtn');
  const sampleBtn = document.getElementById('sampleBtn');
  const clearDataBtn = document.getElementById('clearDataBtn');
  const copyJsonBtn = document.getElementById('copyJsonBtn');
  const downloadJsonBtn = document.getElementById('downloadJsonBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const viewJsonBtn = document.getElementById('viewJsonBtn');
  const closeJsonModalBtn = document.getElementById('closeJsonModalBtn');
  const copyModalJsonBtn = document.getElementById('copyModalJsonBtn');

  // Theme Toggle Elements
  const themeToggleBtn = document.getElementById('themeToggleBtn');

  // History Elements
  const historyToggleBtn = document.getElementById('historyToggleBtn');
  const historyBadgeCount = document.getElementById('historyBadgeCount');
  const historyModal = document.getElementById('historyModal');
  const historyListContainer = document.getElementById('historyListContainer');
  const closeHistoryModalBtn = document.getElementById('closeHistoryModalBtn');
  const closeHistoryFooterBtn = document.getElementById('closeHistoryFooterBtn');
  const clearAllHistoryBtn = document.getElementById('clearAllHistoryBtn');

  // Search/Filter Elements
  const activitySearchInput = document.getElementById('activitySearchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const filterCountBadge = document.getElementById('filterCountBadge');

  // Status & Progress
  const statusContainer = document.getElementById('statusContainer');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const progressDetail = document.getElementById('progressDetail');

  // Results & Empty state
  const resultsSection = document.getElementById('resultsSection');
  const emptyState = document.getElementById('emptyState');
  const errorAlert = document.getElementById('errorAlert');
  const errorMessage = document.getElementById('errorMessage');
  const dismissErrorBtn = document.getElementById('dismissErrorBtn');
  const storageBadge = document.getElementById('storageBadge');
  const storageTime = document.getElementById('storageTime');

  // KPI elements
  const kpiCases = document.getElementById('kpiCases');
  const kpiEvents = document.getElementById('kpiEvents');
  const kpiAvgTime = document.getElementById('kpiAvgTime');
  const kpiVariants = document.getElementById('kpiVariants');
  const kpiSize = document.getElementById('kpiSize');
  const kpiParseTime = document.getElementById('kpiParseTime');

  // Variants Table & Chart Canvas
  const variantsTableBody = document.getElementById('variantsTableBody');
  const variantsChartCanvas = document.getElementById('variantsChart');

  // JSON Modal
  const jsonModal = document.getElementById('jsonModal');
  const jsonPreview = document.getElementById('jsonPreview');

  // Toast
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');

  // Initialization
  init();

  function init() {
    initTheme();
    setupEventListeners();
    renderHistoryBadge();
    loadFromLocalStorage();
  }

  // ==========================================
  // 1. THEME MANAGEMENT (Dark / Light Mode)
  // ==========================================
  function initTheme() {
    let theme = 'dark';
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      if (saved) theme = saved;
    } catch (e) {}

    applyTheme(theme);
  }

  function applyTheme(theme) {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }

    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch (e) {}

    // Re-render chart with matching palette if active
    if (currentSummary && chartInstance) {
      renderChart(currentSummary.payload.top5Variants);
    }
  }

  function toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    const newTheme = isDark ? 'light' : 'dark';
    applyTheme(newTheme);
    showToast(`Thema gewijzigd naar ${newTheme === 'dark' ? 'Donkere' : 'Lichte'} modus`);
  }

  // ==========================================
  // 2. EVENT LISTENERS
  // ==========================================
  function setupEventListeners() {
    // Theme Toggle
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // Drag & Drop
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('border-indigo-500', 'bg-indigo-950/20');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('border-indigo-500', 'bg-indigo-950/20');
      }, false);
    });

    dropZone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    });

    // File Picker
    selectFileBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFile(e.target.files[0]);
      }
    });

    // Sample Dataset
    sampleBtn.addEventListener('click', () => loadSampleDataset());

    // Clear Data
    if (clearDataBtn) {
      clearDataBtn.addEventListener('click', () => clearStoredData());
    }

    // Export Actions
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', exportCSV);
    }
    if (copyJsonBtn) {
      copyJsonBtn.addEventListener('click', copySummaryToClipboard);
    }
    if (downloadJsonBtn) {
      downloadJsonBtn.addEventListener('click', downloadSummaryJson);
    }
    if (viewJsonBtn) {
      viewJsonBtn.addEventListener('click', openJsonModal);
    }
    if (closeJsonModalBtn) {
      closeJsonModalBtn.addEventListener('click', closeJsonModal);
    }
    if (copyModalJsonBtn) {
      copyModalJsonBtn.addEventListener('click', copySummaryToClipboard);
    }

    if (jsonModal) {
      jsonModal.addEventListener('click', (e) => {
        if (e.target === jsonModal) closeJsonModal();
      });
    }

    if (dismissErrorBtn) {
      dismissErrorBtn.addEventListener('click', hideError);
    }

    // Search / Filter
    if (activitySearchInput) {
      activitySearchInput.addEventListener('input', (e) => {
        activeSearchTerm = e.target.value.trim().toLowerCase();
        if (clearSearchBtn) {
          if (activeSearchTerm) clearSearchBtn.classList.remove('hidden');
          else clearSearchBtn.classList.add('hidden');
        }
        filterAndRenderTable();
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        activitySearchInput.value = '';
        activeSearchTerm = '';
        clearSearchBtn.classList.add('hidden');
        filterAndRenderTable();
        activitySearchInput.focus();
      });
    }

    // History Modal
    if (historyToggleBtn) {
      historyToggleBtn.addEventListener('click', openHistoryModal);
    }
    if (closeHistoryModalBtn) {
      closeHistoryModalBtn.addEventListener('click', closeHistoryModal);
    }
    if (closeHistoryFooterBtn) {
      closeHistoryFooterBtn.addEventListener('click', closeHistoryModal);
    }
    if (historyModal) {
      historyModal.addEventListener('click', (e) => {
        if (e.target === historyModal) closeHistoryModal();
      });
    }
    if (clearAllHistoryBtn) {
      clearAllHistoryBtn.addEventListener('click', clearAllHistory);
    }
  }

  // ==========================================
  // 3. FILE PARSING & VALIDATION
  // ==========================================
  function handleFile(file) {
    hideError();
    if (!file) return;

    const isCsv = file.name.toLowerCase().endsWith('.csv') ||
                  file.type === 'text/csv' ||
                  file.type === 'text/plain' ||
                  file.type === 'application/vnd.ms-excel';

    if (!isCsv) {
      showError(`Ongeldig bestandstype: "${file.name}". Upload a.u.b. een geldig .csv bestand.`);
      return;
    }

    startParsing(file);
  }

  function startParsing(file) {
    if (isProcessing) return;
    isProcessing = true;

    showStatus(true);
    updateProgress(10, 'Bestand inlezen in browsergeheugen...', `${file.name} (${formatFileSize(file.size)})`);

    const startTime = performance.now();
    const reader = new FileReader();

    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 40);
        updateProgress(percent, 'Inlezen in browsergeheugen...', `${Math.round(e.loaded / 1024)} KB van ${Math.round(e.total / 1024)} KB`);
      }
    };

    reader.onerror = () => {
      isProcessing = false;
      showStatus(false);
      showError('Fout bij het lokaal inlezen van het bestand via FileReader.');
    };

    reader.onload = (e) => {
      const text = e.target.result;
      updateProgress(50, 'CSV analyseren en valideren...', 'Delimiters en kolommen identificeren');

      setTimeout(() => {
        try {
          processCsvText(text, file.name, startTime);
        } catch (err) {
          isProcessing = false;
          showStatus(false);
          showError(err.message || 'Onverwachte fout tijdens de dataverwerking.');
          console.error(err);
        }
      }, 30);
    };

    reader.readAsText(file);
  }

  function processCsvText(csvText, fileName, startTime) {
    if (!csvText || csvText.trim().length === 0) {
      throw new Error('Het CSV-bestand is leeg.');
    }

    updateProgress(65, 'Rijen en kolommen parsen...', 'Event-log structuren opbouwen');

    // 1. Delimiter
    const firstFewLines = csvText.slice(0, 4000).split(/\r\n|\n|\r/).filter(l => l.trim().length > 0);
    if (firstFewLines.length < 2) {
      throw new Error('Het bestand bevat onvoldoende regels (minimaal 1 header en 1 datarow vereist).');
    }

    const delimiter = detectDelimiter(firstFewLines[0]);

    // 2. Headers
    const headers = parseCsvLine(firstFewLines[0], delimiter).map(h => h.trim());

    // 3. Kolomdetectie
    const colIndices = findRequiredColumnIndices(headers);
    if (!colIndices.valid) {
      throw new Error(
        `Vereiste kolommen ontbreken. Gevonden headers: [${headers.join(', ')}]. ` +
        `Nodig: "Case ID", "Activity", en "Timestamp". Ontbrekend: ${colIndices.missing.join(', ')}.`
      );
    }

    updateProgress(75, 'Groeperen per Case ID...', 'Chronologische volgorde en paden bepalen');

    setTimeout(() => {
      try {
        const rawLines = csvText.split(/\r\n|\n|\r/);
        const casesMap = new Map();
        let totalEvents = 0;
        let skippedRows = 0;

        const caseIdx = colIndices.caseId;
        const actIdx = colIndices.activity;
        const timeIdx = colIndices.timestamp;

        for (let i = 1; i < rawLines.length; i++) {
          const line = rawLines[i];
          if (!line || !line.trim()) continue;

          const cells = parseCsvLine(line, delimiter);
          const caseId = (cells[caseIdx] || '').trim();
          const activity = (cells[actIdx] || '').trim();
          const timeRaw = (cells[timeIdx] || '').trim();

          if (!caseId || !activity || !timeRaw) {
            skippedRows++;
            continue;
          }

          const timestamp = parseTimestamp(timeRaw);
          if (isNaN(timestamp)) {
            skippedRows++;
            continue;
          }

          let caseData = casesMap.get(caseId);
          if (!caseData) {
            caseData = [];
            casesMap.set(caseId, caseData);
          }

          caseData.push({ activity, timestamp });
          totalEvents++;
        }

        if (casesMap.size === 0) {
          throw new Error('Geen geldige cases gevonden in de CSV. Controleer de datums en kolomwaarden.');
        }

        updateProgress(90, 'Procesvarianten & doorlooptijden berekenen...', `${casesMap.size} unieke cases gevonden`);

        setTimeout(() => {
          try {
            const summary = aggregateProcessData(casesMap, totalEvents, fileName, startTime, skippedRows);
            
            // Opslaan in LocalStorage
            saveToLocalStorage(summary);

            // Opslaan in Geschiedenis (laatste 5)
            saveToHistory(summary);

            // Render Dashboard
            currentSummary = summary;
            renderResults(summary);

            updateProgress(100, 'Verwerking voltooid!', `Klaar in ${summary.metadata.parseTimeMs}ms`);
            
            setTimeout(() => {
              showStatus(false);
              isProcessing = false;
              showToast('Event log succesvol verwerkt en bewaard in LocalStorage!');
            }, 300);

          } catch (aggErr) {
            isProcessing = false;
            showStatus(false);
            showError(aggErr.message);
          }
        }, 30);

      } catch (err) {
        isProcessing = false;
        showStatus(false);
        showError(err.message);
      }
    }, 20);
  }

  function detectDelimiter(headerLine) {
    const counts = {
      ',': (headerLine.match(/,/g) || []).length,
      ';': (headerLine.match(/;/g) || []).length,
      '\t': (headerLine.match(/\t/g) || []).length,
      '|': (headerLine.match(/\|/g) || []).length
    };
    let maxDelim = ',';
    let maxCount = -1;
    for (const [delim, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        maxDelim = delim;
      }
    }
    return maxDelim;
  }

  function parseCsvLine(line, delimiter) {
    const result = [];
    let current = '';
    let inQuotes = false;
    const len = line.length;

    for (let i = 0; i < len; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  function findRequiredColumnIndices(headers) {
    const cleanHeaders = headers.map(h => h.replace(/^["']|["']$/g, '').trim().toLowerCase());
    
    let caseIdx = -1;
    let actIdx = -1;
    let timeIdx = -1;

    cleanHeaders.forEach((h, idx) => {
      if (caseIdx === -1 && /^(case[\s_-]?id|case|dossier|order[\s_-]?id|process[\s_-]?id)$/i.test(h)) {
        caseIdx = idx;
      }
      if (actIdx === -1 && /^(activity|concept:name|event[\s_-]?name|task|activiteit|stap|status)$/i.test(h)) {
        actIdx = idx;
      }
      if (timeIdx === -1 && /^(timestamp|time|datetime|date|tijdstempel|datum|start[\s_-]?time|complete[\s_-]?time)$/i.test(h)) {
        timeIdx = idx;
      }
    });

    if (caseIdx === -1) caseIdx = cleanHeaders.findIndex(h => h.includes('case'));
    if (actIdx === -1) actIdx = cleanHeaders.findIndex(h => h.includes('act') || h.includes('task') || h.includes('event'));
    if (timeIdx === -1) timeIdx = cleanHeaders.findIndex(h => h.includes('time') || h.includes('date') || h.includes('tijd'));

    const missing = [];
    if (caseIdx === -1) missing.push('"Case ID"');
    if (actIdx === -1) missing.push('"Activity"');
    if (timeIdx === -1) missing.push('"Timestamp"');

    return {
      valid: missing.length === 0,
      caseId: caseIdx,
      activity: actIdx,
      timestamp: timeIdx,
      missing
    };
  }

  function parseTimestamp(raw) {
    const cleaned = raw.replace(/^["']|["']$/g, '').trim();
    
    if (/^\d{10,13}$/.test(cleaned)) {
      const num = Number(cleaned);
      return cleaned.length === 10 ? num * 1000 : num;
    }

    let parsed = Date.parse(cleaned);
    if (!isNaN(parsed)) return parsed;

    const euroMatch = cleaned.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
    if (euroMatch) {
      const day = parseInt(euroMatch[1], 10);
      const month = parseInt(euroMatch[2], 10) - 1;
      const year = parseInt(euroMatch[3], 10);
      const hour = euroMatch[4] ? parseInt(euroMatch[4], 10) : 0;
      const min = euroMatch[5] ? parseInt(euroMatch[5], 10) : 0;
      const sec = euroMatch[6] ? parseInt(euroMatch[6], 10) : 0;
      return new Date(year, month, day, hour, min, sec).getTime();
    }

    return NaN;
  }

  // ==========================================
  // 4. AGGREGATION LOGIC
  // ==========================================
  function aggregateProcessData(casesMap, totalEvents, fileName, startTime, skippedRows) {
    const totalCases = casesMap.size;
    const variantsMap = new Map();
    let totalThroughputMs = 0;
    const caseDurations = [];

    for (const [caseId, events] of casesMap.entries()) {
      events.sort((a, b) => a.timestamp - b.timestamp);

      const firstTime = events[0].timestamp;
      const lastTime = events[events.length - 1].timestamp;
      const durationMs = Math.max(0, lastTime - firstTime);

      totalThroughputMs += durationMs;
      caseDurations.push(durationMs);

      const pathSteps = events.map(e => e.activity);
      const pathKey = pathSteps.join(' → ');

      let vData = variantsMap.get(pathKey);
      if (!vData) {
        vData = {
          path: pathKey,
          steps: pathSteps,
          count: 0,
          totalDurationMs: 0,
          minDurationMs: Infinity,
          maxDurationMs: -Infinity,
          sampleCaseId: caseId
        };
        variantsMap.set(pathKey, vData);
      }

      vData.count++;
      vData.totalDurationMs += durationMs;
      if (durationMs < vData.minDurationMs) vData.minDurationMs = durationMs;
      if (durationMs > vData.maxDurationMs) vData.maxDurationMs = durationMs;
    }

    caseDurations.sort((a, b) => a - b);
    const medianThroughputMs = caseDurations.length % 2 === 0
      ? (caseDurations[caseDurations.length / 2 - 1] + caseDurations[caseDurations.length / 2]) / 2
      : caseDurations[Math.floor(caseDurations.length / 2)];

    const avgThroughputMs = totalCases > 0 ? Math.round(totalThroughputMs / totalCases) : 0;

    const allVariants = Array.from(variantsMap.values()).sort((a, b) => b.count - a.count);
    const totalVariantsCount = allVariants.length;

    const top5 = allVariants.slice(0, 5).map((v, idx) => {
      const avgDur = Math.round(v.totalDurationMs / v.count);
      return {
        rank: idx + 1,
        path: v.path,
        steps: v.steps,
        caseCount: v.count,
        percentage: Number(((v.count / totalCases) * 100).toFixed(1)),
        avgThroughputMs: avgDur,
        avgThroughputFormatted: formatDuration(avgDur),
        minThroughputFormatted: formatDuration(v.minDurationMs === Infinity ? 0 : v.minDurationMs),
        maxThroughputFormatted: formatDuration(v.maxDurationMs === -Infinity ? 0 : v.maxDurationMs),
        varianceVsOverallAvg: avgThroughputMs > 0 ? Number((((avgDur - avgThroughputMs) / avgThroughputMs) * 100).toFixed(1)) : 0
      };
    });

    const elapsedMs = Math.round(performance.now() - startTime);

    const aggregatedPayload = {
      meta: {
        generator: "AI-Bottleneck Analist (Client-Side Vanilla Engine)",
        analyzedAt: new Date().toISOString(),
        sourceFile: fileName,
        parseTimeMs: elapsedMs,
        skippedRowsCount: skippedRows
      },
      kpis: {
        totalCases,
        totalEvents,
        uniqueVariantsCount: totalVariantsCount,
        avgThroughputMs,
        avgThroughputFormatted: formatDuration(avgThroughputMs),
        medianThroughputMs,
        medianThroughputFormatted: formatDuration(medianThroughputMs)
      },
      top5Variants: top5
    };

    const jsonString = JSON.stringify(aggregatedPayload);
    const byteSize = new Blob([jsonString]).size;
    const sizeKB = (byteSize / 1024).toFixed(2);

    return {
      payload: aggregatedPayload,
      jsonString,
      sizeBytes: byteSize,
      sizeKB: `${sizeKB} KB`,
      metadata: {
        fileName,
        parseTimeMs: elapsedMs,
        analyzedDate: new Date().toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'medium' })
      }
    };
  }

  // ==========================================
  // 5. CHART.JS VISUALIZATION (renderChart)
  // ==========================================
  function renderChart(variants) {
    if (!variantsChartCanvas || typeof Chart === 'undefined') return;

    // Destroy existing chart if present
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }

    if (!variants || variants.length === 0) return;

    const isDark = document.documentElement.classList.contains('dark');

    // Labels and data
    const labels = variants.map(v => `Variant #${v.rank} (${v.percentage}%)`);
    const dataValues = variants.map(v => v.caseCount);

    // Dynamic styling based on dark/light theme
    const textColor = isDark ? '#94a3b8' : '#475569';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
    const barColors = isDark ? [
      '#6366f1', // Variant 1
      '#818cf8', // Variant 2
      '#a5b4fc', // Variant 3
      '#c7d2fe', // Variant 4
      '#e0e7ff'  // Variant 5
    ] : [
      '#4f46e5',
      '#6366f1',
      '#818cf8',
      '#a5b4fc',
      '#c7d2fe'
    ];

    const ctx = variantsChartCanvas.getContext('2d');

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Aantal Cases',
          data: dataValues,
          backgroundColor: barColors.slice(0, variants.length),
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 48
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 600
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            titleColor: isDark ? '#f8fafc' : '#0f172a',
            bodyColor: isDark ? '#cbd5e1' : '#334155',
            borderColor: isDark ? '#334155' : '#e2e8f0',
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            callbacks: {
              title: function (context) {
                const idx = context[0].dataIndex;
                const v = variants[idx];
                return `Variant #${v.rank} (${v.percentage}% van alle cases)`;
              },
              label: function (context) {
                const idx = context.dataIndex;
                const v = variants[idx];
                return ` Cases: ${v.caseCount.toLocaleString('nl-NL')} | Gem. duur: ${v.avgThroughputFormatted}`;
              },
              afterLabel: function (context) {
                const idx = context.dataIndex;
                const v = variants[idx];
                // Show condensed path
                const previewPath = v.steps.length <= 4 
                  ? v.steps.join(' → ')
                  : `${v.steps.slice(0, 2).join(' → ')} → ... → ${v.steps.slice(-2).join(' → ')}`;
                return ` Pad: ${previewPath}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: textColor,
              font: {
                size: 11,
                weight: '500'
              }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: gridColor
            },
            ticks: {
              color: textColor,
              font: {
                size: 11
              },
              precision: 0
            }
          }
        }
      }
    });
  }

  // ==========================================
  // 6. CSV EXPORT FUNCTION (exportCSV)
  // ==========================================
  function exportCSV() {
    if (!currentSummary || !currentSummary.payload || !currentSummary.payload.top5Variants) {
      showError('Geen analyseresultaten beschikbaar om te exporteren.');
      return;
    }

    const { kpis, top5Variants } = currentSummary.payload;
    const meta = currentSummary.metadata;

    const rows = [];

    // Header sectie met algemene statistieken
    rows.push(['"AI-Bottleneck Analist - Geaggregeerde Procesvarianten Export"']);
    rows.push([`"Bronbestand"`, `"${meta.fileName}"`]);
    rows.push([`"Geanalyseerd op"`, `"${meta.analyzedDate}"`]);
    rows.push([`"Totaal Cases"`, kpis.totalCases]);
    rows.push([`"Totaal Events"`, kpis.totalEvents]);
    rows.push([`"Unieke Varianten"`, kpis.uniqueVariantsCount]);
    rows.push([`"Gemiddelde Doorlooptijd Totaal"`, `"${kpis.avgThroughputFormatted}"`]);
    rows.push([]); // Lege regel voor scheiding

    // Tabel headers
    rows.push([
      '"Rang"',
      '"Procespad"',
      '"Aantal Stappen"',
      '"Aantal Cases"',
      '"Aandeel (%)"',
      '"Gemiddelde Doorlooptijd"',
      '"Minimale Doorlooptijd"',
      '"Maximale Doorlooptijd"',
      '"Afwijking tov Gemiddelde (%)"'
    ]);

    // Data regels voor de varianten
    top5Variants.forEach(v => {
      rows.push([
        `"#${v.rank}"`,
        `"${v.path.replace(/"/g, '""')}"`,
        v.steps.length,
        v.caseCount,
        `"${v.percentage}%"`,
        `"${v.avgThroughputFormatted}"`,
        `"${v.minThroughputFormatted}"`,
        `"${v.maxThroughputFormatted}"`,
        `"${v.varianceVsOverallAvg > 0 ? '+' : ''}${v.varianceVsOverallAvg}%"`
      ]);
    });

    // CSV samenstellen met CRLF regeleindes
    const csvContent = '\uFEFF' + rows.map(r => r.join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const cleanBaseName = meta.fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.href = url;
    link.download = `procesvarianten_${cleanBaseName}_${new Date().toISOString().slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('CSV-bestand succesvol geëxporteerd en gedownload!');
  }

  // ==========================================
  // 7. REAL-TIME SEARCH / FILTERING
  // ==========================================
  function filterAndRenderTable() {
    if (!currentSummary || !currentSummary.payload) return;

    const allVariants = currentSummary.payload.top5Variants;
    let filtered = allVariants;

    if (activeSearchTerm) {
      filtered = allVariants.filter(v => {
        const matchesPath = v.path.toLowerCase().includes(activeSearchTerm);
        const matchesStep = v.steps.some(s => s.toLowerCase().includes(activeSearchTerm));
        return matchesPath || matchesStep;
      });
    }

    // Update count indicator badge
    if (filterCountBadge) {
      if (activeSearchTerm) {
        filterCountBadge.textContent = `${filtered.length} van ${allVariants.length} varianten matchen "${activeSearchTerm}"`;
        filterCountBadge.className = 'text-xs text-indigo-600 dark:text-indigo-400 font-semibold';
      } else {
        filterCountBadge.textContent = `${allVariants.length} van ${allVariants.length} varianten zichtbaar`;
        filterCountBadge.className = 'text-xs text-slate-500 dark:text-slate-400 font-medium';
      }
    }

    renderTableRows(filtered);
  }

  function renderTableRows(variants) {
    variantsTableBody.innerHTML = '';

    if (variants.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td colspan="4" class="py-8 text-center text-slate-500 dark:text-slate-400">
          <p class="text-sm font-medium">Geen procesvarianten gevonden die "${escapeHtml(activeSearchTerm)}" bevatten.</p>
          <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">Probeer een andere zoekterm zoals een specifieke activiteitnaam.</p>
        </td>
      `;
      variantsTableBody.appendChild(tr);
      return;
    }

    variants.forEach((variant) => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors';

      // Step chips with highlighting if matching search
      const stepsHtml = variant.steps.map((step, idx) => {
        const isLast = idx === variant.steps.length - 1;
        const isMatch = activeSearchTerm && step.toLowerCase().includes(activeSearchTerm);
        const badgeClasses = isMatch
          ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/40 ring-1 ring-indigo-500/30 font-bold'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700';

        return `
          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${badgeClasses}">
            ${escapeHtml(step)}
          </span>
          ${!isLast ? `<span class="text-slate-400 dark:text-slate-500 text-xs mx-1">→</span>` : ''}
        `;
      }).join('');

      let varianceBadge = '';
      if (variant.varianceVsOverallAvg > 5) {
        varianceBadge = `<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20" title="Trager dan het gemiddelde proces">+${variant.varianceVsOverallAvg}% trager</span>`;
      } else if (variant.varianceVsOverallAvg < -5) {
        varianceBadge = `<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">${variant.varianceVsOverallAvg}% sneller</span>`;
      } else {
        varianceBadge = `<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400">Gemiddeld</span>`;
      }

      tr.innerHTML = `
        <td class="py-4 px-4 align-top whitespace-nowrap">
          <div class="flex items-center space-x-2">
            <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              variant.rank === 1 ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40' :
              variant.rank === 2 ? 'bg-slate-300/40 dark:bg-slate-300/20 text-slate-700 dark:text-slate-200 border border-slate-400/40' :
              variant.rank === 3 ? 'bg-amber-700/20 text-amber-700 dark:text-amber-500 border border-amber-700/40' :
              'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }">
              #${variant.rank}
            </span>
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">${variant.percentage}%</span>
          </div>
        </td>
        <td class="py-4 px-4 align-top">
          <div class="flex flex-wrap items-center gap-y-1.5">
            ${stepsHtml}
          </div>
          <div class="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
            ${variant.steps.length} processtappen
          </div>
        </td>
        <td class="py-4 px-4 align-top text-right whitespace-nowrap">
          <span class="text-sm font-semibold text-slate-900 dark:text-white">${variant.caseCount.toLocaleString('nl-NL')}</span>
          <div class="w-24 ml-auto bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div class="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full" style="width: ${variant.percentage}%"></div>
          </div>
        </td>
        <td class="py-4 px-4 align-top text-right whitespace-nowrap">
          <div class="text-sm font-medium text-slate-800 dark:text-slate-200">${variant.avgThroughputFormatted}</div>
          <div class="mt-1">${varianceBadge}</div>
        </td>
      `;
      variantsTableBody.appendChild(tr);
    });
  }

  // ==========================================
  // 8. HISTORY MANAGEMENT (saveToHistory)
  // ==========================================
  function getHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Fout bij uitlezen geschiedenis:', e);
    }
    return [];
  }

  function saveToHistory(summary) {
    try {
      const history = getHistory();
      const newEntry = {
        id: 'hist_' + Date.now(),
        fileName: summary.metadata.fileName,
        analyzedDate: summary.metadata.analyzedDate,
        totalCases: summary.payload.kpis.totalCases,
        totalEvents: summary.payload.kpis.totalEvents,
        uniqueVariantsCount: summary.payload.kpis.uniqueVariantsCount,
        avgThroughputFormatted: summary.payload.kpis.avgThroughputFormatted,
        summary: summary
      };

      // Vooraan toevoegen, max 5 bewaren
      const updated = [newEntry, ...history.filter(h => h.fileName !== summary.metadata.fileName || h.analyzedDate !== summary.metadata.analyzedDate)].slice(0, 5);
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
      renderHistoryBadge();
    } catch (e) {
      console.warn('Fout bij opslaan geschiedenis:', e);
    }
  }

  function renderHistoryBadge() {
    const history = getHistory();
    if (historyBadgeCount) {
      historyBadgeCount.textContent = history.length;
    }
  }

  function openHistoryModal() {
    if (!historyModal || !historyListContainer) return;

    const history = getHistory();
    historyListContainer.innerHTML = '';

    if (history.length === 0) {
      historyListContainer.innerHTML = `
        <div class="text-center py-8 text-slate-500 dark:text-slate-400">
          <svg class="w-8 h-8 mx-auto text-slate-400 dark:text-slate-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">Nog geen eerdere analyses opgeslagen</p>
          <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">Zodra je een CSV verwerkt, worden de laatste 5 samenvattingen hier bewaard.</p>
        </div>
      `;
    } else {
      history.forEach((item, index) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'pt-3 first:pt-0';
        itemEl.innerHTML = `
          <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div class="flex items-center space-x-2">
                <span class="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[240px] sm:max-w-xs" title="${escapeHtml(item.fileName)}">
                  ${escapeHtml(item.fileName)}
                </span>
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  ${escapeHtml(item.analyzedDate)}
                </span>
              </div>
              <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span><strong>${item.totalCases.toLocaleString('nl-NL')}</strong> cases</span>
                <span>•</span>
                <span><strong>${item.totalEvents.toLocaleString('nl-NL')}</strong> events</span>
                <span>•</span>
                <span><strong>${item.uniqueVariantsCount}</strong> varianten</span>
                <span>•</span>
                <span class="text-indigo-600 dark:text-indigo-400 font-medium">${item.avgThroughputFormatted}</span>
              </div>
            </div>

            <div class="flex items-center space-x-2 shrink-0">
              <button
                data-hist-id="${item.id}"
                class="restore-hist-btn px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm"
              >
                Herstel
              </button>
              <button
                data-hist-delete="${item.id}"
                class="delete-hist-btn p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                title="Verwijder uit geschiedenis"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        `;

        historyListContainer.appendChild(itemEl);
      });

      // Attach button events
      historyListContainer.querySelectorAll('.restore-hist-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-hist-id');
          restoreHistoryItem(id);
        });
      });

      historyListContainer.querySelectorAll('.delete-hist-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-hist-delete');
          deleteHistoryItem(id);
        });
      });
    }

    historyModal.classList.remove('hidden');
  }

  function closeHistoryModal() {
    if (historyModal) historyModal.classList.add('hidden');
  }

  function restoreHistoryItem(id) {
    const history = getHistory();
    const item = history.find(h => h.id === id);
    if (!item) return;

    currentSummary = item.summary;
    saveToLocalStorage(item.summary);
    renderResults(item.summary);
    closeHistoryModal();
    showToast(`Analyse van "${item.fileName}" hersteld!`);
  }

  function deleteHistoryItem(id) {
    let history = getHistory();
    history = history.filter(h => h.id !== id);
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    renderHistoryBadge();
    openHistoryModal(); // Refresh modal content
  }

  function clearAllHistory() {
    if (!confirm('Weet je zeker dat je de gehele analyse-geschiedenis wilt wissen?')) return;
    localStorage.removeItem(STORAGE_KEY_HISTORY);
    renderHistoryBadge();
    openHistoryModal();
    showToast('Geschiedenis gewist.');
  }

  // ==========================================
  // 9. RENDER DASHBOARD RESULTS
  // ==========================================
  function renderResults(summary) {
    emptyState.classList.add('hidden');
    resultsSection.classList.remove('hidden');

    const { kpis, top5Variants } = summary.payload;

    // Update KPI Cards
    kpiCases.textContent = kpis.totalCases.toLocaleString('nl-NL');
    kpiEvents.textContent = kpis.totalEvents.toLocaleString('nl-NL');
    kpiAvgTime.textContent = kpis.avgThroughputFormatted;
    kpiVariants.textContent = kpis.uniqueVariantsCount.toLocaleString('nl-NL');
    kpiSize.textContent = summary.sizeKB;
    kpiParseTime.textContent = `${summary.metadata.parseTimeMs} ms`;

    // Render Table with current filter state
    filterAndRenderTable();

    // Render Chart.js Bar Chart
    renderChart(top5Variants);

    // Active Storage Badge
    if (storageBadge && storageTime) {
      storageBadge.classList.remove('hidden');
      storageBadge.classList.add('flex');
      storageTime.textContent = summary.metadata.analyzedDate;
    }
  }

  // ==========================================
  // 10. LOCAL STORAGE PERSISTENCE
  // ==========================================
  function saveToLocalStorage(summary) {
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(summary));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  function loadFromLocalStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_CURRENT);
      if (data) {
        const parsed = JSON.parse(data);
        currentSummary = parsed;
        renderResults(parsed);
      }
    } catch (e) {
      console.warn('Kan data niet herstellen uit localStorage:', e);
    }
  }

  function clearStoredData() {
    try {
      localStorage.removeItem(STORAGE_KEY_CURRENT);
      currentSummary = null;
      resultsSection.classList.add('hidden');
      emptyState.classList.remove('hidden');
      if (storageBadge) {
        storageBadge.classList.add('hidden');
        storageBadge.classList.remove('flex');
      }
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
      showToast('Opgeslagen data is gewist uit LocalStorage.');
    } catch (e) {
      console.error(e);
    }
  }

  // ==========================================
  // 11. MODAL & EXPORT HELPERS
  // ==========================================
  function copySummaryToClipboard() {
    if (!currentSummary) return;
    const jsonStr = JSON.stringify(currentSummary.payload, null, 2);
    navigator.clipboard.writeText(jsonStr).then(() => {
      showToast('JSON succesvol gekopieerd naar klembord!');
    }).catch(() => {
      showToast('Kopiëren mislukt. Bekijk de JSON via "Bekijk JSON".');
    });
  }

  function downloadSummaryJson() {
    if (!currentSummary) return;
    const jsonStr = JSON.stringify(currentSummary.payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `process_mining_summary_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('JSON-bestand gedownload (< 50KB)!');
  }

  function openJsonModal() {
    if (!currentSummary || !jsonModal || !jsonPreview) return;
    jsonPreview.textContent = JSON.stringify(currentSummary.payload, null, 2);
    jsonModal.classList.remove('hidden');
  }

  function closeJsonModal() {
    if (jsonModal) jsonModal.classList.add('hidden');
  }

  // ==========================================
  // 12. UI FEEDBACK HELPERS
  // ==========================================
  function showStatus(visible) {
    if (statusContainer) {
      if (visible) statusContainer.classList.remove('hidden');
      else statusContainer.classList.add('hidden');
    }
  }

  function updateProgress(percent, text, detail) {
    if (progressBar) progressBar.style.width = `${percent}%`;
    if (progressText) progressText.textContent = text;
    if (progressDetail) progressDetail.textContent = detail;
  }

  function showError(msg) {
    if (errorMessage && errorAlert) {
      errorMessage.textContent = msg;
      errorAlert.classList.remove('hidden');
    }
  }

  function hideError() {
    if (errorAlert) errorAlert.classList.add('hidden');
  }

  function showToast(msg) {
    if (!toast || !toastMessage) return;
    toastMessage.textContent = msg;
    toast.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-2');
    toast.classList.add('opacity-100', 'translate-y-0');

    setTimeout(() => {
      toast.classList.add('opacity-0', 'pointer-events-none', 'translate-y-2');
      toast.classList.remove('opacity-100', 'translate-y-0');
    }, 3500);
  }

  function formatDuration(ms) {
    if (!ms || ms <= 0) return '0m';

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      const remHours = hours % 24;
      return `${days}d ${remHours}u`;
    }
    if (hours > 0) {
      const remMins = minutes % 60;
      return `${hours}u ${remMins}m`;
    }
    if (minutes > 0) {
      const remSecs = seconds % 60;
      return `${minutes}m ${remSecs}s`;
    }
    return `${(ms / 1000).toFixed(1)}s`;
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
  }

  // ==========================================
  // 13. CELONIS SAMPLE DATASET GENERATOR
  // ==========================================
  function loadSampleDataset() {
    hideError();
    const rows = ['"Case ID","Activity","Timestamp","Resource","Amount"'];
    const totalCases = 200;
    const baseDate = new Date(2024, 0, 15, 8, 0, 0);

    for (let c = 1; c <= totalCases; c++) {
      const caseId = `PO-2024-${String(c).padStart(4, '0')}`;
      const caseStartTime = new Date(baseDate.getTime() + c * 3600000 * 3.5);
      let t = caseStartTime.getTime();

      const rand = Math.random();
      let steps = [];

      if (rand < 0.55) {
        // Standard Happy Path (~2.5 dagen)
        steps = [
          { act: 'Receive Order', deltaHrs: 0 },
          { act: 'Credit Check Approved', deltaHrs: 4 },
          { act: 'Generate Invoice', deltaHrs: 12 },
          { act: 'Pick & Pack Goods', deltaHrs: 24 },
          { act: 'Goods Dispatched', deltaHrs: 18 },
          { act: 'Payment Received', deltaHrs: 48 }
        ];
      } else if (rand < 0.75) {
        // Price change rework bottleneck (~6.5 dagen)
        steps = [
          { act: 'Receive Order', deltaHrs: 0 },
          { act: 'Price Change Requested', deltaHrs: 8 },
          { act: 'Manager Approval', deltaHrs: 48 },
          { act: 'Credit Check Approved', deltaHrs: 14 },
          { act: 'Generate Invoice', deltaHrs: 20 },
          { act: 'Pick & Pack Goods', deltaHrs: 30 },
          { act: 'Goods Dispatched', deltaHrs: 22 },
          { act: 'Payment Received', deltaHrs: 52 }
        ];
      } else if (rand < 0.90) {
        // Fast-Track Auto Approved (~1.2 dagen)
        steps = [
          { act: 'Receive Order', deltaHrs: 0 },
          { act: 'Auto-Credit Approved', deltaHrs: 1 },
          { act: 'Pick & Pack Goods', deltaHrs: 6 },
          { act: 'Goods Dispatched', deltaHrs: 8 },
          { act: 'Payment Received', deltaHrs: 14 }
        ];
      } else {
        // Credit Reject & Customer Contact (~8.2 dagen)
        steps = [
          { act: 'Receive Order', deltaHrs: 0 },
          { act: 'Credit Check Flagged', deltaHrs: 6 },
          { act: 'Customer Contacted', deltaHrs: 72 },
          { act: 'Credit Re-evaluated', deltaHrs: 24 },
          { act: 'Generate Invoice', deltaHrs: 16 },
          { act: 'Pick & Pack Goods', deltaHrs: 28 },
          { act: 'Goods Dispatched', deltaHrs: 26 },
          { act: 'Payment Received', deltaHrs: 60 }
        ];
      }

      steps.forEach(step => {
        t += step.deltaHrs * 3600000 + Math.floor(Math.random() * 600000);
        const iso = new Date(t).toISOString().replace('T', ' ').slice(0, 19);
        rows.push(`"${caseId}","${step.act}","${iso}","User_${(c % 6) + 1}","€${(Math.random() * 4000 + 500).toFixed(2)}"`);
      });
    }

    const sampleCsv = rows.join('\n');
    const blob = new Blob([sampleCsv], { type: 'text/csv' });
    const file = new File([blob], 'celonis_sample_order_to_cash.csv', { type: 'text/csv' });

    startParsing(file);
  }

})();
