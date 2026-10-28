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
  const STORAGE_KEY_GEMINI_KEY = 'ai_bottleneck_gemini_key';
  const SUPABASE_URL = 'https://wllvfqseygzflhxjcbxx.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_sgqDhrYKYToCWuNkIPy9Ig_N4YW11S9';
  const ANALYSIS_HISTORY_TABLE = 'analysis_history';
  const BOTTLENECK_ALERTS_TABLE = 'bottleneck_alerts';

  // State
  let currentSummary = null;
  let isProcessing = false;
  let chartInstance = null;
  let activeSearchTerm = '';
  let isGeneratingAiAdvice = false;
  let activePageId = 'pageAnalyse';
  let supabaseClient = null;
  let currentUser = null;
  const verzondenAlertsSet = new Set();
  let geregistreerdeAlerts = [];

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

  // Gemini AI Elements
  const geminiApiKeyInput = document.getElementById('geminiApiKeyInput');
  const toggleApiKeyVisibility = document.getElementById('toggleApiKeyVisibility');
  const eyeIconShow = document.getElementById('eyeIconShow');
  const eyeIconHide = document.getElementById('eyeIconHide');
  const apiKeyStatusBadge = document.getElementById('apiKeyStatusBadge');
  const generateAiAdviceBtn = document.getElementById('generateAiAdviceBtn');
  const generateAiAdviceSectionBtn = document.getElementById('generateAiAdviceSectionBtn');
  const aiBtnSpinner = document.getElementById('aiBtnSpinner');
  const aiBtnIcon = document.getElementById('aiBtnIcon');
  const aiBtnText = document.getElementById('aiBtnText');
  const aiAdviceContainer = document.getElementById('aiAdviceContainer');
  const aiEmptyState = document.getElementById('aiEmptyState');
  const aiLoadingState = document.getElementById('aiLoadingState');
  const aiLoadingStatusText = document.getElementById('aiLoadingStatusText');
  const aiErrorState = document.getElementById('aiErrorState');
  const aiErrorMessage = document.getElementById('aiErrorMessage');
  const aiResultState = document.getElementById('aiResultState');
  const aiAdviceContent = document.getElementById('aiAdviceContent');
  const aiTimestamp = document.getElementById('aiTimestamp');
  const copyAiAdviceBtn = document.getElementById('copyAiAdviceBtn');
  const aiTokensInfo = document.getElementById('aiTokensInfo');

  // Multi-Page Stepper Navigation Elements
  const tabBtnAnalyse = document.getElementById('tabBtnAnalyse');
  const tabBtnAiAdvies = document.getElementById('tabBtnAiAdvies');
  const tabBtnOplossing = document.getElementById('tabBtnOplossing');
  const pageAnalyse = document.getElementById('pageAnalyse');
  const pageAiAdvies = document.getElementById('pageAiAdvies');
  const pageOplossing = document.getElementById('pageOplossing');
  const tab1DataIndicator = document.getElementById('tab1DataIndicator');
  const tab2AdviesBadge = document.getElementById('tab2AdviesBadge');
  const goToAiAdviesFromBottomBtn = document.getElementById('goToAiAdviesFromBottomBtn');
  const goToOplossingFromAdviceBtn = document.getElementById('goToOplossingFromAdviceBtn');
  const aiActiveDatasetName = document.getElementById('aiActiveDatasetName');
  const aiActiveDatasetMetrics = document.getElementById('aiActiveDatasetMetrics');
  const backToAnalyseBtns = document.querySelectorAll('.back-to-analyse-btn');
  const backToAdviceBtns = document.querySelectorAll('.back-to-advice-btn');

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
  const predictionsTableBody = document.getElementById('predictionsTableBody');
  const alertsAuditBody = document.getElementById('alertsAuditBody');
  const alertsAuditStatus = document.getElementById('alertsAuditStatus');

  // JSON Modal
  const jsonModal = document.getElementById('jsonModal');
  const jsonPreview = document.getElementById('jsonPreview');

  // Toast
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');

  // Initialization
  void init();

  async function init() {
    initTheme();
    initApiKey();
    initPageRouting();
    setupEventListeners();
    loadFromLocalStorage();
    await initSupabaseAuth();
    await haalVerzondenAlertsOp();
    await renderHistoryBadge();
    updatePage2DatasetPreview();
  }

  async function initSupabaseAuth() {
    try {
      if (!window.supabase || typeof window.supabase.createClient !== 'function') return false;

      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
      let { data, error } = await supabaseClient.auth.getSession();
      if (error) throw error;

      if (!data.session) {
        ({ data, error } = await supabaseClient.auth.signInAnonymously());
        if (error) throw error;
      }

      currentUser = data.session?.user || data.user || null;
      return Boolean(currentUser);
    } catch (error) {
      console.warn('Supabase auth niet beschikbaar, lokale geschiedenis blijft actief:', error);
      supabaseClient = null;
      currentUser = null;
      return false;
    }
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

    if (predictionsTableBody) {
      predictionsTableBody.addEventListener('click', (event) => {
        const button = event.target.closest('.alert-send-btn');
        if (!button) return;
        const candidate = getAlertCandidates()[Number(button.dataset.alertIndex)];
        if (candidate) void verstuurAlert(button, candidate);
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

    // Multi-Page Navigation Listeners
    if (tabBtnAnalyse) tabBtnAnalyse.addEventListener('click', () => switchPage('pageAnalyse'));
    if (tabBtnAiAdvies) tabBtnAiAdvies.addEventListener('click', () => switchPage('pageAiAdvies'));
    if (tabBtnOplossing) tabBtnOplossing.addEventListener('click', () => switchPage('pageOplossing'));

    if (goToAiAdviesFromBottomBtn) {
      goToAiAdviesFromBottomBtn.addEventListener('click', () => {
        switchPage('pageAiAdvies');
      });
    }

    if (goToOplossingFromAdviceBtn) {
      goToOplossingFromAdviceBtn.addEventListener('click', () => {
        switchPage('pageOplossing');
      });
    }

    backToAnalyseBtns.forEach(btn => {
      btn.addEventListener('click', () => switchPage('pageAnalyse'));
    });

    backToAdviceBtns.forEach(btn => {
      btn.addEventListener('click', () => switchPage('pageAiAdvies'));
    });

    // Google Gemini AI Listeners
    if (toggleApiKeyVisibility) {
      toggleApiKeyVisibility.addEventListener('click', toggleApiKeyVisibilityHandler);
    }
    if (geminiApiKeyInput) {
      geminiApiKeyInput.addEventListener('input', handleApiKeyInput);
    }
    if (generateAiAdviceBtn) {
      // Knop op Pagina 1: navigeert naar Pagina 2 en activeert het AI-advies
      generateAiAdviceBtn.addEventListener('click', () => {
        switchPage('pageAiAdvies');

        if (!currentSummary || !currentSummary.payload) {
          showToast('Upload eerst een CSV-bestand in Stap 1.');
          return;
        }

        let apiKey = (geminiApiKeyInput ? geminiApiKeyInput.value : '').trim();
        if (!apiKey) {
          try {
            apiKey = (localStorage.getItem(STORAGE_KEY_GEMINI_KEY) || '').trim();
          } catch (e) {}
        }

        if (!apiKey) {
          showToast('Vul je Google Gemini API Key in om het advies te genereren.');
          if (geminiApiKeyInput) {
            setTimeout(() => geminiApiKeyInput.focus(), 300);
          }
          return;
        }

        // Genereer advies op pagina 2
        generateAiAdvice();
      });
    }
    if (generateAiAdviceSectionBtn) {
      generateAiAdviceSectionBtn.addEventListener('click', generateAiAdvice);
    }
    if (copyAiAdviceBtn) {
      copyAiAdviceBtn.addEventListener('click', copyAiAdviceToClipboard);
    }
  }

  // ==========================================
  // 2B. MULTI-PAGE STEPPER / ROUTING MANAGEMENT
  // ==========================================
  function initPageRouting() {
    const hash = window.location.hash;
    if (hash === '#ai-advies') {
      switchPage('pageAiAdvies', false);
    } else if (hash === '#oplossing') {
      switchPage('pageOplossing', false);
    } else {
      switchPage('pageAnalyse', false);
    }

    window.addEventListener('hashchange', () => {
      const currentHash = window.location.hash;
      if (currentHash === '#ai-advies') {
        switchPage('pageAiAdvies', false);
      } else if (currentHash === '#oplossing') {
        switchPage('pageOplossing', false);
      } else {
        switchPage('pageAnalyse', false);
      }
    });
  }

  function switchPage(targetPageId, updateHash = true) {
    activePageId = targetPageId;

    const pages = [
      { id: 'pageAnalyse', el: pageAnalyse, tab: tabBtnAnalyse, hash: '#analyse' },
      { id: 'pageAiAdvies', el: pageAiAdvies, tab: tabBtnAiAdvies, hash: '#ai-advies' },
      { id: 'pageOplossing', el: pageOplossing, tab: tabBtnOplossing, hash: '#oplossing' }
    ];

    pages.forEach(p => {
      if (!p.el) return;
      const isTarget = p.id === targetPageId;
      if (isTarget) {
        p.el.classList.remove('hidden');
      } else {
        p.el.classList.add('hidden');
      }

      if (p.tab) {
        const badge = p.tab.querySelector('.step-badge');
        if (isTarget) {
          p.tab.className = 'tab-nav-btn inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 shadow-sm';
          if (badge) {
            badge.className = 'step-badge w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold bg-indigo-600 text-white';
          }
        } else {
          p.tab.className = 'tab-nav-btn inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent';
          if (badge) {
            badge.className = 'step-badge w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
          }
        }
      }
    });

    if (updateHash) {
      const activeObj = pages.find(p => p.id === targetPageId);
      if (activeObj && window.location.hash !== activeObj.hash) {
        history.replaceState(null, '', activeObj.hash);
      }
    }

    if (targetPageId === 'pageAnalyse' && chartInstance) {
      setTimeout(() => {
        try { chartInstance.resize(); } catch (_) {}
      }, 50);
    }

    if (targetPageId === 'pageAiAdvies') {
      updatePage2DatasetPreview();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updatePage2DatasetPreview() {
    if (!aiActiveDatasetName || !aiActiveDatasetMetrics) return;

    if (currentSummary && currentSummary.payload) {
      aiActiveDatasetName.textContent = currentSummary.metadata.fileName;
      aiActiveDatasetName.classList.remove('text-slate-400', 'italic');
      aiActiveDatasetName.classList.add('text-indigo-600', 'dark:text-indigo-400');
      
      const { kpis } = currentSummary.payload;
      aiActiveDatasetMetrics.textContent = `${kpis.totalCases.toLocaleString('nl-NL')} cases • ${kpis.totalEvents.toLocaleString('nl-NL')} events • ${kpis.uniqueVariantsCount} unieke procesvarianten • Gem. doorlooptijd: ${kpis.avgThroughputFormatted}`;
    } else {
      aiActiveDatasetName.textContent = 'Geen dataset geladen';
      aiActiveDatasetName.classList.remove('text-indigo-600', 'dark:text-indigo-400');
      aiActiveDatasetName.classList.add('text-slate-400', 'italic');
      aiActiveDatasetMetrics.textContent = 'Laad eerst een CSV in Stap 1 om de statistieken hier automatisch in te laden.';
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

        setTimeout(async () => {
          try {
            const summary = aggregateProcessData(casesMap, totalEvents, fileName, startTime, skippedRows);
            
            // Opslaan in LocalStorage
            saveToLocalStorage(summary);

            // Opslaan in Geschiedenis (laatste 5)
            saveToHistory(summary);

            // Render Dashboard
            currentSummary = summary;
            renderResults(summary);
            await haalVerzondenAlertsOp();

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

  function getBottleneckStep(events) {
    if (!events || events.length < 2) return events?.[0]?.activity || 'Onbekende stap';

    let largestGap = -1;
    let bottleneckStep = events[0].activity;
    for (let index = 1; index < events.length; index++) {
      const gap = events[index].timestamp - events[index - 1].timestamp;
      if (gap > largestGap) {
        largestGap = gap;
        bottleneckStep = events[index - 1].activity;
      }
    }
    return bottleneckStep;
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
          sampleCaseId: caseId,
          sampleBottleneckStep: getBottleneckStep(events)
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
        varianceVsOverallAvg: avgThroughputMs > 0 ? Number((((avgDur - avgThroughputMs) / avgThroughputMs) * 100).toFixed(1)) : 0,
        sampleCaseId: v.sampleCaseId,
        sampleBottleneckStep: v.sampleBottleneckStep
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
        .map(v => ({
          ...v,
          riskPercentage: Math.min(99, Math.max(0, Math.round(50 + Math.max(0, v.varianceVsOverallAvg)))),
          caseId: v.sampleCaseId,
          bottleneckStep: v.sampleBottleneckStep || v.steps[Math.max(0, v.steps.length - 1)]
        }))
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

  async function haalVerzondenAlertsOp() {
    verzondenAlertsSet.clear();
    geregistreerdeAlerts = [];

    if (!supabaseClient || !currentUser) {
      renderAlertsAudit();
      if (alertsAuditStatus) alertsAuditStatus.textContent = 'Supabase is niet beschikbaar; auditlog kan niet worden geladen.';
      return false;
    }

    try {
      const { data, error } = await supabaseClient
        .from(BOTTLENECK_ALERTS_TABLE)
        .select('case_id, knelpunt_stap, risico_percentage, huidige_duur_uren, timestamp_alert')
        .order('timestamp_alert', { ascending: false });

      if (error) throw error;

      geregistreerdeAlerts = Array.isArray(data) ? data : [];
      geregistreerdeAlerts.forEach((row) => {
        if (row.case_id && row.knelpunt_stap) {
          verzondenAlertsSet.add(`${row.case_id}:::${row.knelpunt_stap}`);
        }
      });

      if (alertsAuditStatus) {
        alertsAuditStatus.textContent = `${geregistreerdeAlerts.length} alert(s) uit Supabase geladen.`;
      }
      renderVoorspellingsTabel();
      renderAlertsAudit();
      return true;
    } catch (error) {
      console.warn('Supabase alerts ophalen mislukt:', error);
      if (alertsAuditStatus) alertsAuditStatus.textContent = 'De geregistreerde alerts konden niet worden geladen.';
      renderAlertsAudit();
      return false;
    }
  }

  function getAlertCandidates() {
    const variants = currentSummary?.payload?.top5Variants || [];
    return variants
      .filter((variant) => variant.riskPercentage > 75 && variant.caseId && variant.bottleneckStep)
      .map((variant) => ({
        case_id: String(variant.caseId),
        knelpunt_stap: String(variant.bottleneckStep),
        risico_percentage: variant.riskPercentage,
        huidige_duur_uren: Number((variant.avgThroughputMs / 3600000).toFixed(2))
      }));
  }

  function renderVoorspellingsTabel() {
    if (!predictionsTableBody) return;
    const candidates = getAlertCandidates();
    predictionsTableBody.innerHTML = '';

    if (!candidates.length) {
      predictionsTableBody.innerHTML = '<tr><td colspan="5" class="py-5 px-4 text-sm text-slate-500 dark:text-slate-400">Geen voorspelde risico-alerts boven 75% in deze analyse.</td></tr>';
      return;
    }

    candidates.forEach((candidate, index) => {
      const key = `${candidate.case_id}:::${candidate.knelpunt_stap}`;
      const alreadySent = verzondenAlertsSet.has(key);
      const row = document.createElement('tr');
      row.className = 'border-b border-slate-100 dark:border-slate-800/60';
      row.innerHTML = `
        <td class="py-3 px-4 font-medium">${escapeHtml(candidate.case_id)}</td>
        <td class="py-3 px-4">${escapeHtml(candidate.knelpunt_stap)}</td>
        <td class="py-3 px-4 text-right font-semibold text-rose-600 dark:text-rose-400">${candidate.risico_percentage}%</td>
        <td class="py-3 px-4 text-right">${candidate.huidige_duur_uren.toLocaleString('nl-NL')} uur</td>
        <td class="py-3 px-4 text-right">
          <button type="button" data-alert-index="${index}" class="alert-send-btn ${alreadySent ? 'btn-disabled' : ''}" ${alreadySent ? 'disabled' : ''}>
            ${alreadySent ? '✅ Alert verzonden' : '⚠️ Verstuur Alert'}
          </button>
        </td>
      `;
      predictionsTableBody.appendChild(row);
    });
  }

  async function verstuurAlert(button, candidate) {
    const key = `${candidate.case_id}:::${candidate.knelpunt_stap}`;
    if (verzondenAlertsSet.has(key)) return;

    button.disabled = true;
    button.classList.add('btn-disabled');
    button.textContent = 'Verzenden...';

    const timestamp = new Date().toISOString();
    const payload = {
      case_id: candidate.case_id,
      knelpunt_stap: candidate.knelpunt_stap,
      risico_percentage: candidate.risico_percentage,
      huidige_duur_uren: candidate.huidige_duur_uren,
      timestamp_alert: timestamp
    };
    let makeError = null;
    let webhookConfigured = true;
    let supabaseError = null;

    try {
      const response = await fetch('/api/send-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      let result = null;
      try {
        result = await response.json();
      } catch (error) {
        result = null;
      }
      if (!response.ok || !result?.success) {
        webhookConfigured = result?.configured !== false;
        throw new Error(result?.error || `HTTP ${response.status}`);
      }
    } catch (error) {
      makeError = error;
      console.warn('Alert via serverless Make-proxy mislukt:', error);
    }

    if (supabaseClient && currentUser) {
      try {
        const { data, error } = await supabaseClient
          .from(BOTTLENECK_ALERTS_TABLE)
          .insert(payload)
          .select('case_id, knelpunt_stap, timestamp_alert')
          .single();
        if (error) throw error;
        geregistreerdeAlerts.unshift(data || payload);
      } catch (error) {
        supabaseError = error;
        console.warn('Alert opslaan in Supabase mislukt:', error);
      }
    } else {
      supabaseError = new Error('Supabase is niet verbonden.');
    }

    if (!supabaseError) {
      verzondenAlertsSet.add(key);
      button.textContent = '✅ Alert verzonden';
      renderAlertsAudit();
      if (makeError) {
        showToast(webhookConfigured
          ? 'Alert opgeslagen; Make.com was tijdelijk niet bereikbaar.'
          : 'Alert opgeslagen; de Make-webhook moet nog worden geconfigureerd.');
      } else {
        showToast('Alert verzonden en opgeslagen.');
      }
      return;
    }

    button.disabled = false;
    button.classList.remove('btn-disabled');
    button.textContent = '⚠️ Verstuur Alert';
    showToast(makeError ? 'Make.com en Supabase konden de alert niet verwerken.' : 'Alert niet opgeslagen in Supabase. Probeer opnieuw.');
  }

  function renderAlertsAudit() {
    if (!alertsAuditBody) return;
    alertsAuditBody.innerHTML = '';
    if (!geregistreerdeAlerts.length) {
      alertsAuditBody.innerHTML = '<tr><td colspan="4" class="py-5 px-4 text-sm text-slate-500 dark:text-slate-400">Nog geen geregistreerde alerts.</td></tr>';
      return;
    }
    geregistreerdeAlerts.forEach((alert) => {
      const row = document.createElement('tr');
      row.className = 'border-b border-slate-100 dark:border-slate-800/60';
      row.innerHTML = `
        <td class="py-3 px-4">${escapeHtml(new Date(alert.timestamp_alert).toLocaleString('nl-NL'))}</td>
        <td class="py-3 px-4">${escapeHtml(alert.case_id)}</td>
        <td class="py-3 px-4">${escapeHtml(alert.knelpunt_stap)}</td>
        <td class="py-3 px-4 text-right">${alert.risico_percentage ?? '—'}%</td>
      `;
      alertsAuditBody.appendChild(row);
    });
  }

  // ==========================================
  // 8. HISTORY MANAGEMENT (saveToHistory)
  // ==========================================
  function getLocalHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Fout bij uitlezen geschiedenis:', e);
    }
    return [];
  }

  async function getHistory() {
    if (supabaseClient && currentUser) {
      try {
        const { data, error } = await supabaseClient
          .from(ANALYSIS_HISTORY_TABLE)
          .select('id, file_name, analyzed_date, total_cases, total_events, unique_variants_count, avg_throughput_formatted, summary')
          .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map((item) => ({
          id: item.id,
          fileName: item.file_name,
          analyzedDate: item.analyzed_date,
          totalCases: item.total_cases,
          totalEvents: item.total_events,
          uniqueVariantsCount: item.unique_variants_count,
          avgThroughputFormatted: item.avg_throughput_formatted,
          summary: item.summary
        }));
      } catch (error) {
        console.warn('Supabase geschiedenis ophalen mislukt:', error);
      }
    }

    return [];
  }

  async function saveToHistory(summary) {
    if (supabaseClient && currentUser) {
      try {
        const { error } = await supabaseClient.from(ANALYSIS_HISTORY_TABLE).insert({
          user_id: currentUser.id,
          file_name: summary.metadata.fileName,
          analyzed_date: summary.metadata.analyzedDate,
          total_cases: summary.payload.kpis.totalCases,
          total_events: summary.payload.kpis.totalEvents,
          unique_variants_count: summary.payload.kpis.uniqueVariantsCount,
          avg_throughput_formatted: summary.payload.kpis.avgThroughputFormatted,
          summary
        });

        if (!error) {
          await renderHistoryBadge();
          return;
        }
        throw error;
      } catch (error) {
        console.warn('Supabase geschiedenis opslaan mislukt:', error);
        return;
      }
    }

    console.warn('Geen Supabase-user beschikbaar; analysegeschiedenis wordt niet lokaal opgeslagen.');
  }

  async function renderHistoryBadge() {
    const history = await getHistory();
    if (historyBadgeCount) {
      historyBadgeCount.textContent = history.length;
    }
  }

  async function openHistoryModal() {
    if (!historyModal || !historyListContainer) return;

    const history = await getHistory();
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

  async function restoreHistoryItem(id) {
    const history = await getHistory();
    const item = history.find(h => h.id === id);
    if (!item) return;

    currentSummary = item.summary;
    saveToLocalStorage(item.summary);
    renderResults(item.summary);
    closeHistoryModal();
    showToast(`Analyse van "${item.fileName}" hersteld!`);
  }

  async function deleteHistoryItem(id) {
    if (supabaseClient && currentUser) {
      const { error } = await supabaseClient
        .from(ANALYSIS_HISTORY_TABLE)
        .delete()
        .eq('id', id)
        .eq('user_id', currentUser.id);

      if (error) {
        console.warn('Supabase geschiedenis verwijderen mislukt:', error);
        return;
      }
    } else return;

    await renderHistoryBadge();
    await openHistoryModal(); // Refresh modal content
  }

  async function clearAllHistory() {
    if (!confirm('Weet je zeker dat je de gehele analyse-geschiedenis wilt wissen?')) return;

    if (supabaseClient && currentUser) {
      const { error } = await supabaseClient
        .from(ANALYSIS_HISTORY_TABLE)
        .delete()
        .eq('user_id', currentUser.id);

      if (error) {
        console.warn('Supabase geschiedenis wissen mislukt:', error);
        return;
      }
    } else return;

    await renderHistoryBadge();
    await openHistoryModal();
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
    renderVoorspellingsTabel();
    renderAlertsAudit();

    // Active Storage Badge
    if (storageBadge && storageTime) {
      storageBadge.classList.remove('hidden');
      storageBadge.classList.add('flex');
      storageTime.textContent = summary.metadata.analyzedDate;
    }

    // Step indicators & dataset preview
    if (tab1DataIndicator) tab1DataIndicator.classList.remove('hidden');
    updatePage2DatasetPreview();

    // Restore or reset AI Advice UI
    if (summary.aiAdvice && summary.aiAdvice.text) {
      renderAiAdvice(summary.aiAdvice.text, summary.aiAdvice.timestamp);
      if (tab2AdviesBadge) tab2AdviesBadge.classList.remove('hidden');
    } else {
      resetAiAdviceUI();
      if (tab2AdviesBadge) tab2AdviesBadge.classList.add('hidden');
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
      if (tab1DataIndicator) tab1DataIndicator.classList.add('hidden');
      if (tab2AdviesBadge) tab2AdviesBadge.classList.add('hidden');
      updatePage2DatasetPreview();
      resetAiAdviceUI();
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

  // ==========================================
  // 14. GOOGLE GEMINI AI ADVICE (REST FETCH)
  // ==========================================
  function initApiKey() {
    try {
      const savedKey = localStorage.getItem(STORAGE_KEY_GEMINI_KEY);
      if (savedKey && geminiApiKeyInput) {
        geminiApiKeyInput.value = savedKey;
        if (apiKeyStatusBadge) {
          apiKeyStatusBadge.classList.remove('hidden');
        }
      }
    } catch (e) {
      console.warn('Fout bij laden API-key uit localStorage:', e);
    }
  }

  function handleApiKeyInput(e) {
    const key = (e.target.value || '').trim();
    try {
      if (key) {
        localStorage.setItem(STORAGE_KEY_GEMINI_KEY, key);
        if (apiKeyStatusBadge) apiKeyStatusBadge.classList.remove('hidden');
      } else {
        localStorage.removeItem(STORAGE_KEY_GEMINI_KEY);
        if (apiKeyStatusBadge) apiKeyStatusBadge.classList.add('hidden');
      }
    } catch (err) {
      console.warn('Fout bij opslaan API-key:', err);
    }
  }

  function toggleApiKeyVisibilityHandler() {
    if (!geminiApiKeyInput) return;
    const isPassword = geminiApiKeyInput.type === 'password';
    geminiApiKeyInput.type = isPassword ? 'text' : 'password';

    if (eyeIconShow && eyeIconHide) {
      if (isPassword) {
        eyeIconShow.classList.add('hidden');
        eyeIconHide.classList.remove('hidden');
      } else {
        eyeIconShow.classList.remove('hidden');
        eyeIconHide.classList.add('hidden');
      }
    }
  }

  /**
   * Compacte Zero-data-leak aggregatie-extractie (< 3KB JSON).
   * Verzendt uitsluitend berekende KPI-statistieken en procesvarianten; nooit ruwe CSV-records.
   */
  function extractKpiSummaryForAi(summary) {
    if (!summary || !summary.payload) return null;
    const { kpis, top5Variants } = summary.payload;

    // Sorteer op doorlooptijd om langzaamste én snelste varianten te bepalen
    const sortedByDuration = [...top5Variants].sort((a, b) => b.avgThroughputMs - a.avgThroughputMs);
    const slowestVariant = sortedByDuration[0] || null;
    const fastestVariant = sortedByDuration[sortedByDuration.length - 1] || null;

    // Detecteer varianten met vertraging t.o.v. het algemeen gemiddelde (> 0% trager)
    const bottleneckVariants = top5Variants
      .filter(v => v.varianceVsOverallAvg > 0)
      .map(v => ({
        variant_rang: `#${v.rank}`,
        procespad: v.path,
        processtappen: v.steps,
        aantal_cases: v.caseCount,
        aandeel_percentage: `${v.percentage}%`,
        gemiddelde_doorlooptijd: v.avgThroughputFormatted,
        minimale_doorlooptijd: v.minThroughputFormatted,
        maximale_doorlooptijd: v.maxThroughputFormatted,
        vertraging_tov_algemeen_gemiddelde: `+${v.varianceVsOverallAvg}%`
      }));

    const totalDelayedCases = bottleneckVariants.reduce((sum, v) => sum + v.aantal_cases, 0);
    const totalDelayedPercentage = kpis.totalCases > 0 ? Number(((totalDelayedCases / kpis.totalCases) * 100).toFixed(1)) : 0;

    return {
      analyse_metadata: {
        bronbestand: summary.metadata.fileName,
        geanalyseerd_op: summary.metadata.analyzedDate
      },
      proces_kpis: {
        totaal_cases: kpis.totalCases,
        totaal_events: kpis.totalEvents,
        unieke_procesvarianten: kpis.uniqueVariantsCount,
        algemene_gemiddelde_doorlooptijd: kpis.avgThroughputFormatted,
        mediane_doorlooptijd: kpis.medianThroughputFormatted,
        totaal_vertraagde_cases: `${totalDelayedCases} van de ${kpis.totalCases} cases (${totalDelayedPercentage}%)`
      },
      top_procesvarianten: top5Variants.map(v => ({
        rang: v.rank,
        pad: v.path,
        stappen: v.steps,
        aantal_stappen: v.steps.length,
        aantal_cases: v.caseCount,
        aandeel_percentage: `${v.percentage}%`,
        gemiddelde_doorlooptijd: v.avgThroughputFormatted,
        minimale_doorlooptijd: v.minThroughputFormatted,
        maximale_doorlooptijd: v.maxThroughputFormatted,
        afwijking_tov_algemeen_gemiddelde: `${v.varianceVsOverallAvg > 0 ? '+' : ''}${v.varianceVsOverallAvg}%`
      })),
      geconstateerde_knelpunten: {
        aantal_vertraagde_varianten: bottleneckVariants.length,
        totaal_cases_in_bottlenecks: `${totalDelayedCases} (${totalDelayedPercentage}%)`,
        langzaamste_variant: slowestVariant ? {
          rang: `#${slowestVariant.rank}`,
          pad: slowestVariant.path,
          stappen: slowestVariant.steps,
          gemiddelde_doorlooptijd: slowestVariant.avgThroughputFormatted,
          minimale_doorlooptijd: slowestVariant.minThroughputFormatted,
          maximale_doorlooptijd: slowestVariant.maxThroughputFormatted,
          afwijking_tov_gemiddelde: `+${slowestVariant.varianceVsOverallAvg}%`
        } : null,
        snelste_procesroute_benchmark: fastestVariant && fastestVariant !== slowestVariant ? {
          rang: `#${fastestVariant.rank}`,
          pad: fastestVariant.path,
          doorlooptijd: fastestVariant.avgThroughputFormatted,
          aandeel: `${fastestVariant.percentage}%`
        } : null,
        vertraagde_procesvarianten: bottleneckVariants
      }
    };
  }

  /**
   * Asynchrone fetch-aanroep naar Google Gemini 3.8 Flash REST endpoint
   */
  async function generateAiAdvice() {
    if (isGeneratingAiAdvice) return;

    if (!currentSummary || !currentSummary.payload) {
      showToast('Laad eerst een dataset in om AI-advies te kunnen genereren.');
      return;
    }

    // Haal API key op
    let apiKey = (geminiApiKeyInput ? geminiApiKeyInput.value : '').trim();
    if (!apiKey) {
      try {
        apiKey = (localStorage.getItem(STORAGE_KEY_GEMINI_KEY) || '').trim();
      } catch (e) {}
    }

    if (!apiKey) {
      showAiError('Voer eerst een geldige Google Gemini API Key in om de procesanalyse te starten. De sleutel wordt uitsluitend lokaal in je browser bewaard.');
      if (geminiApiKeyInput) {
        geminiApiKeyInput.focus();
      }
      return;
    }

    // Sla op in LocalStorage
    try {
      localStorage.setItem(STORAGE_KEY_GEMINI_KEY, apiKey);
      if (apiKeyStatusBadge) apiKeyStatusBadge.classList.remove('hidden');
    } catch (e) {}

    // Extract compacte KPI-statistieken
    const kpiSummary = extractKpiSummaryForAi(currentSummary);
    if (!kpiSummary) {
      showAiError('Kon geen geaggregeerde KPI-statistieken samenstellen uit de dataset.');
      return;
    }

    setAiLoading(true);

    const systemPromptText = `Je bent een Principal Process Mining & AI Transformation Consultant. Je analyseert geaggregeerde procesmining-statistieken (KPI's, varianten, events en bottlenecks).
Jouw taak is het leveren van een uitbundig, diepgaand en gedegen onderbouwd adviesrapport in helder, zakelijk en adviserend Nederlands.

Belangrijke richtlijnen:
1. De rapportage bevat altijd een uitgebreide bottleneck-diagnose (1), een diepgaande root cause analyse (2), en een uitgebreid advies over wat er geautomatiseerd dient te worden (3).
2. Zorg dat het advies uitbundig en rijk gedetailleerd is: onderbouw stellingen met concrete cijfers uit de data (percentages, tijdsverschillen tussen varianten, aantal geraakte cases, spreiding tussen min en max).
3. Geef in het adviesgedeelte concrete, tastbare handvatten over wélke handmatige handelingen en stappen geëlimineerd of geautomatiseerd moeten worden, inclusief Straight-Through Processing (STP) en intelligente AI-oplossingen (die als basis dienen voor Stap 3 van deze applicatie).

Hanteer altijd de volgende 4 gestructureerde hoofdsecties in Markdown:

## 1. Uitgebreide Bottleneck- en Knelpuntdiagnose
- Benoem exact welke specifieke procesroutes, stappen en handmatige overgangen de grootste vertraging in de keten veroorzaken.
- Kwantitatieve onderbouwing: Vergelijk de doorlooptijd van de langzaamste variant(en) met het procesgemiddelde, de mediaan en de snelste 'happy flow'. Benoem het exacte aantal en percentage cases dat hierdoor geraakt wordt, inclusief de spreiding (min-max).

## 2. Diepgaande Oorzaakanalyse (Root Causes)
- Waarom ontstaat dit knelpunt in de praktijk? (bijv. herwerk/rework, wachttijd op goedkeuringen, menselijke overdrachten, validatiefouten, inconsistente werkinstructies of ontbrekende systeemkoppelingen).
- Maak een helder onderscheid tussen menselijke/organisatorische oorzaken en systeemtechnische fricties.

## 3. Advies: Wat dient er geautomatiseerd te worden?
Werk een concreet, uitvoerig en strategisch automatiseringsadvies uit:
- **Concrete handmatige taken die geautomatiseerd moeten worden**:
  Benoem specifiek welke individuele activiteiten en overgangen (zoals manuele goedkeuringen, handmatige kredietbeoordelingen, data-overdracht tussen systemen, prijsvalidaties of herhalende controles) direct uit de menselijke werkstroom gehaald moeten worden en waarom.
- **A. Straight-Through Processing (STP) & Regelgebaseerde Automatisering**:
  Welke standaardgevallen kunnen 100% 'zero-touch' (zonder enige menselijke interventie) worden afgehandeld via automatische validatieregels, API-koppelingen tussen ERP/CRM en geautomatiseerde triggers?
- **B. Intelligente & AI-Gedreven Automatisering (Voorbereiding op Stap 3: AI-Oplossing Bouwen)**:
  Welke geavanceerde AI-, LLM- of machine learning oplossingen kunnen ingezet worden voor complexere uitzonderingen? (Denk aan: AI-gebaseerde voorspellende risicoscoring, geautomatiseerde documentextractie en -validatie, intelligente uitzonderingstriage, automatische communicatie-agents of voorspellende routering).
- **C. Directe Procesoptimalisaties (Quick Wins)**:
  Wat kan de organisatie direct in beleid, drempelwaarden of routing aanpassen om de wachttijd per direct te verminderen terwijl de automatisering wordt ingericht?

## 4. Kwantitatieve Impact & Meetbare Business Case
- Welke potentiële tijdwinst en doorlooptijdreductie (in uren/dagen en %) is realistisch haalbaar als deze automatiseringen worden doorgevoerd?
- Welke 3 kern-KPI's moet het procesmanagement monitoren om het succes structureel te borgen (bijv. STP-ratio, first-time-right ratio, gemiddelde doorlooptijd van uitzonderingen)?`;

    const userPromptText = `Hier zijn de geaggregeerde procesmining-statistieken van het geanalyseerde proces:\n\n${JSON.stringify(kpiSummary, null, 2)}\n\nStel een uitbundig, diepgaand en grondig onderbouwd adviesrapport op volgens de 4 secties:\n1. Uitgebreide Bottleneck- en Knelpuntdiagnose (kwantitatief onderbouwd)\n2. Diepgaande Oorzaakanalyse (Root Causes)\n3. Advies: Wat dient er geautomatiseerd te worden? (met specifieke handmatige stappen die geëlimineerd moeten worden, Straight-Through Processing en AI-automatisering)\n4. Kwantitatieve Impact & Meetbare Business Case\n\nBesteed in sectie 3 nadrukkelijk en uitgebreid aandacht aan wat er precies geautomatiseerd dient te worden.`;

    const requestPayload = {
      system_instruction: {
        parts: [
          { text: systemPromptText }
        ]
      },
      contents: [
        {
          role: "user",
          parts: [
            { text: userPromptText }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 3500
      }
    };

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        let errMessage = `HTTP ${response.status} ${response.statusText}`;
        try {
          const errData = await response.json();
          if (errData && errData.error && errData.error.message) {
            errMessage = errData.error.message;
          }
        } catch (_) {}

        if (response.status === 400 || response.status === 403) {
          throw new Error(`Ongeldige API-sleutel of onvoldoende rechten (HTTP ${response.status}). Controleer of je de juiste Google Gemini API Key hebt ingevoerd: ${errMessage}`);
        } else if (response.status === 429) {
          throw new Error(`Google Gemini API quotum overschreden (Rate limit / Quota exceeded, HTTP 429). Probeer het over een minuut nog eens.`);
        } else {
          throw new Error(`Fout bij aanroepen Gemini API (HTTP ${response.status}): ${errMessage}`);
        }
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        throw new Error('Geen adviestekst ontvangen van Google Gemini API.');
      }

      const timestamp = new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      // Bewaar advies in state en LocalStorage
      currentSummary.aiAdvice = {
        text: generatedText,
        timestamp: `Gegenereerd om ${timestamp}`
      };
      saveToLocalStorage(currentSummary);

      renderAiAdvice(generatedText, `Gegenereerd om ${timestamp}`);
      if (tab2AdviesBadge) tab2AdviesBadge.classList.remove('hidden');
      showToast('Uitgebreid AI-advies en oplossingen succesvol gegenereerd!');

    } catch (error) {
      console.error('Gemini API Error:', error);
      let userFriendlyMsg = error.message;
      if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('NetworkError'))) {
        userFriendlyMsg = 'Netwerkfout: kon geen verbinding maken met Google Generative Language API. Controleer je internetverbinding of adblocker.';
      }
      showAiError(userFriendlyMsg);
    } finally {
      setAiLoading(false);
    }
  }

  function setAiLoading(isLoading) {
    isGeneratingAiAdvice = isLoading;

    if (generateAiAdviceBtn) {
      generateAiAdviceBtn.disabled = isLoading;
      if (isLoading) {
        generateAiAdviceBtn.classList.add('opacity-75', 'cursor-not-allowed');
      } else {
        generateAiAdviceBtn.classList.remove('opacity-75', 'cursor-not-allowed');
      }
    }

    if (generateAiAdviceSectionBtn) {
      generateAiAdviceSectionBtn.disabled = isLoading;
      if (isLoading) {
        generateAiAdviceSectionBtn.classList.add('opacity-75', 'cursor-not-allowed');
      } else {
        generateAiAdviceSectionBtn.classList.remove('opacity-75', 'cursor-not-allowed');
      }
    }

    if (aiBtnSpinner) {
      if (isLoading) aiBtnSpinner.classList.remove('hidden');
      else aiBtnSpinner.classList.add('hidden');
    }
    if (aiBtnIcon) {
      if (isLoading) aiBtnIcon.classList.add('hidden');
      else aiBtnIcon.classList.remove('hidden');
    }
    if (aiBtnText) {
      aiBtnText.textContent = isLoading ? 'Analyseren & Oplossingen genereren...' : 'Genereer AI-advies';
    }

    if (isLoading) {
      if (aiEmptyState) aiEmptyState.classList.add('hidden');
      if (aiErrorState) aiErrorState.classList.add('hidden');
      if (aiResultState) aiResultState.classList.add('hidden');
      if (aiLoadingState) aiLoadingState.classList.remove('hidden');
    } else {
      if (aiLoadingState) aiLoadingState.classList.add('hidden');
    }
  }

  function showAiError(msg) {
    if (aiLoadingState) aiLoadingState.classList.add('hidden');
    if (aiEmptyState) aiEmptyState.classList.add('hidden');
    if (aiResultState) aiResultState.classList.add('hidden');
    if (aiErrorState && aiErrorMessage) {
      aiErrorMessage.textContent = msg;
      aiErrorState.classList.remove('hidden');
    }
  }

  function renderAiAdvice(text, timestampText) {
    if (aiEmptyState) aiEmptyState.classList.add('hidden');
    if (aiLoadingState) aiLoadingState.classList.add('hidden');
    if (aiErrorState) aiErrorState.classList.add('hidden');

    if (aiResultState && aiAdviceContent) {
      aiAdviceContent.innerHTML = formatMarkdownToHtml(text);
      if (aiTimestamp) aiTimestamp.textContent = timestampText || '';
      aiResultState.classList.remove('hidden');
    }
  }

  function resetAiAdviceUI() {
    if (aiLoadingState) aiLoadingState.classList.add('hidden');
    if (aiErrorState) aiErrorState.classList.add('hidden');
    if (aiResultState) aiResultState.classList.add('hidden');
    if (aiEmptyState) aiEmptyState.classList.remove('hidden');
  }

  function formatMarkdownToHtml(markdown) {
    if (!markdown) return '';

    const lines = markdown.split(/\r?\n/);
    const htmlChunks = [];
    let inList = false;
    let inTable = false;
    let tableRows = [];

    function flushList() {
      if (inList) {
        htmlChunks.push('</ul>');
        inList = false;
      }
    }

    function flushTable() {
      if (inTable && tableRows.length > 0) {
        let tableHtml = '<div class="overflow-x-auto my-3"><table class="min-w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">';
        tableRows.forEach((row, rIdx) => {
          const cells = row.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => c.trim());
          if (rIdx === 0) {
            tableHtml += '<thead class="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold"><tr>';
            cells.forEach(c => tableHtml += `<th class="px-3 py-2 text-left border-b border-slate-200 dark:border-slate-700">${formatInlineMarkdown(c)}</th>`);
            tableHtml += '</tr></thead><tbody>';
          } else if (rIdx === 1 && cells.every(c => /^[-:]+$/.test(c))) {
            // divider row, skip
          } else {
            tableHtml += '<tr class="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/30">';
            cells.forEach(c => tableHtml += `<td class="px-3 py-2 text-slate-700 dark:text-slate-300">${formatInlineMarkdown(c)}</td>`);
            tableHtml += '</tr>';
          }
        });
        tableHtml += '</tbody></table></div>';
        htmlChunks.push(tableHtml);
        inTable = false;
        tableRows = [];
      }
    }

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();

      // Table line check
      if (line.startsWith('|') && line.endsWith('|')) {
        flushList();
        inTable = true;
        tableRows.push(line);
        continue;
      } else if (inTable) {
        flushTable();
      }

      if (!line) {
        flushList();
        continue;
      }

      // Horizontal rule (--- or ***)
      if (/^([-*_]){3,}$/.test(line)) {
        flushList();
        htmlChunks.push('<hr class="my-4 border-slate-200 dark:border-slate-800" />');
        continue;
      }

      // Blockquote (> )
      if (line.startsWith('> ')) {
        flushList();
        const quoteContent = formatInlineMarkdown(line.slice(2));
        htmlChunks.push(`
          <div class="my-2.5 p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border-l-4 border-indigo-500 text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed italic">
            ${quoteContent}
          </div>
        `);
        continue;
      }

      // Headers (####, ###, ##, #)
      if (line.startsWith('#### ')) {
        flushList();
        const headingText = formatInlineMarkdown(line.slice(5));
        htmlChunks.push(`<h5 class="text-xs font-bold text-slate-800 dark:text-slate-200 mt-3 mb-1 uppercase tracking-wider">${headingText}</h5>`);
        continue;
      }
      if (line.startsWith('### ')) {
        flushList();
        const headingText = formatInlineMarkdown(line.slice(4));
        htmlChunks.push(`
          <div class="mt-4 mb-2 flex items-center gap-2">
            <span class="w-1.5 h-3.5 bg-indigo-500 rounded-full"></span>
            <h4 class="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">${headingText}</h4>
          </div>
        `);
        continue;
      }
      if (line.startsWith('## ') || line.startsWith('# ')) {
        flushList();
        const clean = line.replace(/^#+\s*/, '');
        const headingText = formatInlineMarkdown(clean);
        htmlChunks.push(`
          <div class="mt-6 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span class="p-1 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-mono">▸</span>
              <span>${headingText}</span>
            </h3>
          </div>
        `);
        continue;
      }

      // Numbered list item (e.g. "1. ..." or "1) ...")
      const numMatch = line.match(/^(\d+)[\.\)]\s+(.*)/);
      if (numMatch) {
        flushList();
        const num = numMatch[1];
        const content = formatInlineMarkdown(numMatch[2]);
        htmlChunks.push(`
          <div class="p-3.5 my-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-xs">
            <div class="flex items-start gap-2.5">
              <span class="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">${num}</span>
              <div class="flex-1 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">${content}</div>
            </div>
          </div>
        `);
        continue;
      }

      // Bullet list item (* or -)
      if (line.startsWith('* ') || line.startsWith('- ')) {
        if (!inList) {
          htmlChunks.push('<ul class="space-y-2 pl-4 my-2">');
          inList = true;
        }
        const bulletContent = formatInlineMarkdown(line.slice(2));
        htmlChunks.push(`<li class="list-disc list-outside text-slate-600 dark:text-slate-300 text-xs leading-relaxed">${bulletContent}</li>`);
        continue;
      }

      // Standard paragraph
      flushList();
      htmlChunks.push(`<p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed my-1.5">${formatInlineMarkdown(line)}</p>`);
    }

    flushList();
    flushTable();

    return htmlChunks.join('\n');
  }

  function formatInlineMarkdown(str) {
    if (!str) return '';
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900 dark:text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-slate-700 dark:text-slate-300">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700">$1</code>');
  }

  function copyAiAdviceToClipboard() {
    if (!currentSummary || !currentSummary.aiAdvice || !currentSummary.aiAdvice.text) {
      showToast('Nog geen advies gegenereerd om te kopiëren.');
      return;
    }
    navigator.clipboard.writeText(currentSummary.aiAdvice.text).then(() => {
      showToast('AI-advies gekopieerd naar klembord!');
    }).catch(() => {
      showToast('Kopiëren mislukt.');
    });
  }

})();
