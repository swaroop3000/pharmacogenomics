document.addEventListener('DOMContentLoaded', () => {
    // State
    let allDrugs = [];
    let selectedDrug = null;
    let geneticState = {}; // { CYP2C19: { allele1: '*1', allele2: '*2', phenotypeData: null } }

    // DOM Elements
    const searchInput = document.getElementById('drug-search-input');
    const searchResults = document.getElementById('drug-search-results');
    const clearSearchBtn = document.getElementById('clear-search');
    const geneticInputsContainer = document.getElementById('genetic-inputs-container');
    const recommendationContent = document.getElementById('recommendation-content');
    
    // Theme Elements
    const themeSelector = document.getElementById('theme-selector');
    const modeToggle = document.getElementById('mode-toggle');

    // Initialize application
    async function init() {
        setupTheme();
        
        searchInput.disabled = true;
        searchInput.placeholder = "> SYSTEM INITIALIZING...";
        
        // Start boot sequence animation and data fetch in parallel
        const bootPromise = runBootSequence();
        allDrugs = await fetchAllActionableDrugs();
        await bootPromise;
        
        searchInput.disabled = false;
        searchInput.placeholder = "> ENTER MEDICATION NAME (E.G. CODEINE)...";
        
        setupSearch();
    }

    async function runBootSequence() {
        const lines = [
            { text: "INITIALIZING PGx_PRECISION...", status: "load" },
            { text: "CONNECTING TO CPIC_CENTRAL_DB...", status: "load" },
            { text: "FETCHING GENE-DRUG PAIRS...", status: "ok" },
            { text: "RESOLVING ACTIONABLE GUIDELINES...", status: "ok" },
            { text: "SYSTEM_CHECK: 100% FUNCTIONAL.", status: "ok" },
            { text: "AWAITING_USER_QUERY_", status: "load" }
        ];

        recommendationContent.innerHTML = '<div class="empty-state"><div class="boot-log"></div></div>';
        const log = recommendationContent.querySelector('.boot-log');

        for (let i = 0; i < lines.length; i++) {
            const line = document.createElement('div');
            line.className = 'boot-line';
            line.innerHTML = `> ${lines[i].text} [ <span class="status-${lines[i].status}">${lines[i].status.toUpperCase()}</span> ]`;
            log.appendChild(line);
            
            // Trigger animation
            setTimeout(() => line.classList.add('active'), 50);
            
            await new Promise(r => setTimeout(r, 400 + Math.random() * 400));
        }
    }

    function setupTheme() {
        // Load preferences
        const savedTheme = localStorage.getItem('pgx_theme') || 'retro';
        const savedMode = localStorage.getItem('pgx_mode') || 'dark';

        // Apply preferences
        document.body.dataset.theme = savedTheme;
        document.body.dataset.mode = savedMode;
        themeSelector.value = savedTheme;
        updateModeButton(savedMode);

        // Listeners
        themeSelector.addEventListener('change', (e) => {
            const newTheme = e.target.value;
            document.body.dataset.theme = newTheme;
            localStorage.setItem('pgx_theme', newTheme);
        });

        modeToggle.addEventListener('click', () => {
            const currentMode = document.body.dataset.mode;
            const newMode = currentMode === 'dark' ? 'light' : 'dark';
            document.body.dataset.mode = newMode;
            localStorage.setItem('pgx_mode', newMode);
            updateModeButton(newMode);
        });
    }

    function updateModeButton(currentMode) {
        modeToggle.textContent = currentMode === 'dark' ? '[ GO LIGHT ]' : '[ GO DARK ]';
    }

    function setupSearch() {
        let timeoutId = null;

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            // Toggle clear button
            if (query.length > 0) {
                clearSearchBtn.classList.add('has-text');
            } else {
                clearSearchBtn.classList.remove('has-text');
            }

            if (query.length < 1) {
                searchResults.classList.remove('active');
                return;
            }

            // Debounce input to avoid overwhelming the RxNorm API
            if (timeoutId) clearTimeout(timeoutId);
            
            // Show inline loader
            searchResults.innerHTML = '<div class="search-result-item"><div class="search-result-name" style="color: var(--text-muted)">> SEARCHING GENOMICS DATABASE... <span class="blink">_</span></div></div>';
            searchResults.classList.add('active');

            timeoutId = setTimeout(async () => {
                const matched = await searchRxNormDrugs(query, allDrugs);
                renderSearchResults(matched, query);
            }, 300);
        });

        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearSearchBtn.classList.remove('has-text');
            searchResults.classList.remove('active');
            searchInput.focus();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target) && !clearSearchBtn.contains(e.target)) {
                searchResults.classList.remove('active');
            }
        });
        
        // Show all results if clicked on input and has text
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim().length > 0) {
                searchResults.classList.add('active');
            }
        });
    }

    function highlightMatch(text, query) {
        if (!query) return text;
        const index = text.toLowerCase().indexOf(query.toLowerCase());
        if (index === -1) return text;
        
        const before = text.substring(0, index);
        const match = text.substring(index, index + query.length);
        const after = text.substring(index + query.length);
        
        return `${before}<span class="match-highlight">${match}</span>${after}`;
    }

    function renderSearchResults(results, query) {
        searchResults.innerHTML = '';
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="search-result-item"><div class="search-result-name" style="color: var(--text-muted)">[!] NO MATCHING MEDICATIONS FOUND</div></div>';
        } else {
            const limited = results.slice(0, 20);
            limited.forEach(drug => {
                const item = document.createElement('div');
                item.className = 'search-result-item';
                
                const geneStr = drug.geneList.length > 0 ? drug.geneList.join(', ') : 'NONE';
                const pTag = drug.hasPGx ? '<span style="color: var(--accent-secondary); font-size: 0.8rem; margin-left: 0.5rem;">[PGx ACTIONABLE]</span>' : '';
                
                item.innerHTML = `
                    <div class="search-result-name">${highlightMatch(drug.name, query)} ${pTag}</div>
                    <div class="search-result-genes">REQUIRES_GENES: [${geneStr}]</div>
                `;
                item.onclick = () => {
                    selectDrug(drug);
                    searchInput.value = drug.name;
                    clearSearchBtn.classList.add('has-text');
                    searchResults.classList.remove('active');
                };
                searchResults.appendChild(item);
            });
        }
        searchResults.classList.add('active');
    }

    async function selectDrug(drug) {
        selectedDrug = drug;
        geneticState = {}; 
        
        if (drug.geneList.length === 0) {
            geneticInputsContainer.innerHTML = `
                <div class="placeholder-text" style="color: var(--text-muted)">
                    > NO GENETIC PARAMETERS REQUIRED FOR STANDARD DOSING PROTOCOLS.
                </div>
            `;
            recommendationContent.innerHTML = `
                <div class="empty-state fade-in">
                    <p>> PROCESSING DRUG DOSING GUIDELINE FOR ${drug.name.toUpperCase()}... <span class="blink">_</span></p>
                </div>`;
        } else {
            // Show loading state for inputs
            geneticInputsContainer.innerHTML = '<div class="placeholder-text">> ESTABLISHING CONNECTION TO CPIC... <span class="blink">_</span></div>';
            recommendationContent.innerHTML = `
                <div class="empty-state fade-in">
                    <div class="empty-icon">[?]</div>
                    <p>> AWAITING GENETIC INPUT FOR ${drug.name.toUpperCase()}</p>
                </div>`;
        }
        
        await renderGeneticInputs(drug);
        updateRecommendation();
    }

    async function renderGeneticInputs(drug) {
        geneticInputsContainer.innerHTML = '';
        const genes = drug.geneList;

        if (genes.length === 0) {
            return;
        }

        for (const gene of genes) {
            geneticState[gene] = { allele1: '', allele2: '', phenotypeData: null };
            
            const group = document.createElement('div');
            group.className = 'input-group fade-in';
            
            const label = document.createElement('label');
            label.className = 'input-label';
            label.textContent = `> ${gene}_DIPLOTYPE:`;
            group.appendChild(label);

            const dropdownsContainer = document.createElement('div');
            dropdownsContainer.style.display = 'flex';
            dropdownsContainer.style.gap = '1rem';

            // Fetch alleles from CPIC
            const options = await fetchAlleles(gene);

            // Allele 1 Select
            const select1Wrapper = document.createElement('div');
            select1Wrapper.className = 'select-wrapper';
            select1Wrapper.style.flex = '1';
            const select1 = document.createElement('select');
            select1.className = 'custom-select';
            select1.innerHTML = '<option value="">[ ALLELE 1 ]</option>' + options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
            
            // Allele 2 Select
            const select2Wrapper = document.createElement('div');
            select2Wrapper.className = 'select-wrapper';
            select2Wrapper.style.flex = '1';
            const select2 = document.createElement('select');
            select2.className = 'custom-select';
            select2.innerHTML = '<option value="">[ ALLELE 2 ]</option>' + options.map(opt => `<option value="${opt}">${opt}</option>`).join('');

            select1.onchange = async (e) => {
                geneticState[gene].allele1 = e.target.value;
                await handleAlleleChange(group, gene);
            };
            select2.onchange = async (e) => {
                geneticState[gene].allele2 = e.target.value;
                await handleAlleleChange(group, gene);
            };

            select1Wrapper.appendChild(select1);
            select2Wrapper.appendChild(select2);
            dropdownsContainer.appendChild(select1Wrapper);
            dropdownsContainer.appendChild(select2Wrapper);
            
            group.appendChild(dropdownsContainer);
            
            // Container for phenotype display
            const phenoContainer = document.createElement('div');
            phenoContainer.className = 'pheno-container';
            group.appendChild(phenoContainer);

            geneticInputsContainer.appendChild(group);
        }
    }

    async function handleAlleleChange(groupContainer, gene) {
        const state = geneticState[gene];
        const phenoContainer = groupContainer.querySelector('.pheno-container');
        phenoContainer.innerHTML = '';
        state.phenotypeData = null;

        if (state.allele1 && state.allele2) {
            phenoContainer.innerHTML = '<div class="phenotype-display">> RESOLVING PHENOTYPE... <span class="blink">_</span></div>';
            
            const diplotypeData = await lookupPhenotype(gene, state.allele1, state.allele2);
            if (diplotypeData) {
                state.phenotypeData = diplotypeData;
                
                // Color class based on result text
                const resultText = diplotypeData.generesult.toLowerCase();
                let pClass = 'phenotype-normal';
                if (resultText.includes('poor')) pClass = 'phenotype-poor';
                else if (resultText.includes('intermediate') || resultText.includes('decreased')) pClass = 'phenotype-intermediate';
                else if (resultText.includes('rapid') || resultText.includes('ultrarapid') || resultText.includes('high sensitivity')) pClass = 'phenotype-rapid';

                phenoContainer.innerHTML = `
                    <div class="phenotype-display ${pClass}">
                        <span>> RESOLVED: [ <span class="badge">${diplotypeData.generesult}</span> ]</span>
                    </div>
                `;
            } else {
                phenoContainer.innerHTML = `
                    <div class="phenotype-display phenotype-poor">
                        <span>> ERR: [ <span class="badge">UNKNOWN PHENOTYPE</span> ]</span>
                    </div>
                `;
            }

            await updateRecommendation();
        } else {
            // Need both alleles
            updateRecommendation();
        }
    }

    async function updateRecommendation() {
        if (!selectedDrug) return;

        // Check if all required genes are filled and resolved
        const requiredGenes = selectedDrug.geneList;
        const allResolved = requiredGenes.every(g => geneticState[g] && geneticState[g].phenotypeData);
        
        if (!allResolved) {
            recommendationContent.innerHTML = `
                <div class="empty-state fade-in">
                    <div class="empty-icon">[?]</div>
                    <p>> AWAITING GENETIC INPUT FOR ${selectedDrug.name.toUpperCase()}</p>
                </div>`;
            return;
        }

        recommendationContent.innerHTML = `
            <div class="empty-state fade-in">
                <p>> QUERYING INTEGRATED EVIDENCE DATABASES... <span class="blink">_</span></p>
            </div>
        `;

        // Extract lookup keys and phenotypes
        const lookupKeys = {};
        const phenotypes = {};
        for (const gene of requiredGenes) {
            const diplotypeData = geneticState[gene].phenotypeData;
            phenotypes[gene] = diplotypeData.generesult;
            
            // Add all keys from diplotypeData.lookupkey
            if (diplotypeData.lookupkey) {
                Object.assign(lookupKeys, diplotypeData.lookupkey);
            }
        }

        const consolidated = await getConsolidatedPGxEvidence(selectedDrug, lookupKeys, phenotypes);
        renderRecommendationUI(consolidated);
    }

    function renderRecommendationUI(rec) {
        // Construct phenoSummary
        let phenoSummary = 'None';
        if (rec.geneList && rec.geneList.length > 0) {
            phenoSummary = Object.entries(rec.phenotypes)
                .map(([g, p]) => `${g} (${p})`)
                .join(', ');
        }
        
        // Guidelines URL mapping
        const guidelineUrl = selectedDrug.guidelineId 
            ? `https://cpicpgx.org/guidelines/guideline-for-${selectedDrug.name.toLowerCase().replace(/ /g, '-')}/` 
            : 'https://cpicpgx.org/guidelines/';
            
        // Build cards
        let cpicCard = '';
        if (rec.cpic) {
            const bClass = rec.cpic.type === 'danger' ? 'badge-danger' : (rec.cpic.type === 'warning' ? 'badge-warning' : 'badge-success');
            cpicCard = `
                <div class="db-card">
                    <div class="db-header">
                        <span class="db-title">[1] CPIC RECOMMENDATION (USA)</span>
                        <span class="db-badge ${bClass}">[ ${rec.cpic.action} ]</span>
                    </div>
                    <div class="db-content">
                        Patient Profile: <strong>${phenoSummary}</strong>.<br><br>
                        <strong>Guideline:</strong> ${rec.cpic.text}
                    </div>
                </div>
            `;
        } else {
            cpicCard = `
                <div class="db-card">
                    <div class="db-header">
                        <span class="db-title">[1] CPIC RECOMMENDATION (USA)</span>
                        <span class="db-badge badge-info">[ NO DATA ]</span>
                    </div>
                    <div class="db-content" style="color: var(--text-muted)">
                        There are currently no actionable CPIC clinical dosing guidelines available for this medication.
                    </div>
                </div>
            `;
        }

        let dpwgCard = '';
        if (rec.dpwg) {
            let bClass = 'badge-success';
            if (rec.dpwg.actionClass === 'action-avoid') bClass = 'badge-danger';
            else if (rec.dpwg.actionClass === 'action-caution') bClass = 'badge-warning';
            
            dpwgCard = `
                <div class="db-card">
                    <div class="db-header">
                        <span class="db-title">[2] DPWG GUIDELINE (NETHERLANDS)</span>
                        <span class="db-badge ${bClass}">[ ${rec.dpwg.action} ]</span>
                    </div>
                    <div class="db-content">
                        <strong>Guideline:</strong> ${rec.dpwg.text}
                    </div>
                </div>
            `;
        } else {
            dpwgCard = `
                <div class="db-card">
                    <div class="db-header">
                        <span class="db-title">[2] DPWG GUIDELINE (NETHERLANDS)</span>
                        <span class="db-badge badge-info">[ NO DATA ]</span>
                    </div>
                    <div class="db-content" style="color: var(--text-muted)">
                        No Dutch Pharmacogenetics Working Group (DPWG) dosing guidelines are annotated for this medication.
                    </div>
                </div>
            `;
        }

        let fdaCard = '';
        if (rec.fda) {
            let bClass = 'badge-success';
            if (rec.fda.warningClass === 'action-avoid') bClass = 'badge-danger';
            else if (rec.fda.warningClass === 'action-caution') bClass = 'badge-warning';
            
            fdaCard = `
                <div class="db-card">
                    <div class="db-header">
                        <span class="db-title">[3] FDA LABEL ANNOTATION (REGULATORY)</span>
                        <span class="db-badge ${bClass}">[ ${rec.fda.warningType} ]</span>
                    </div>
                    <div class="db-content">
                        <strong>Label Text:</strong> ${rec.fda.text}
                    </div>
                </div>
            `;
        } else {
            fdaCard = `
                <div class="db-card">
                    <div class="db-header">
                        <span class="db-title">[3] FDA LABEL ANNOTATION (REGULATORY)</span>
                        <span class="db-badge badge-info">[ NO WARNING ]</span>
                    </div>
                    <div class="db-content" style="color: var(--text-muted)">
                        No specific pharmacogenomic warning or testing requirements are annotated in the FDA product label.
                    </div>
                </div>
            `;
        }

        let pgkbCard = '';
        if (rec.pharmgkb) {
            let bClass = 'badge-info';
            if (rec.pharmgkb.level.includes('1')) bClass = 'badge-success';
            else if (rec.pharmgkb.level.includes('2')) bClass = 'badge-warning';
            
            pgkbCard = `
                <div class="db-card">
                    <div class="db-header">
                        <span class="db-title">[4] PHARMGKB CLINICAL EVIDENCE</span>
                        <span class="db-badge ${bClass}">[ ${rec.pharmgkb.level} ]</span>
                    </div>
                    <div class="db-content">
                        <strong>Evidence Summary:</strong> ${rec.pharmgkb.text}
                    </div>
                </div>
            `;
        } else {
            pgkbCard = `
                <div class="db-card">
                    <div class="db-header">
                        <span class="db-title">[4] PHARMGKB CLINICAL EVIDENCE</span>
                        <span class="db-badge badge-info">[ NO ASSOC ]</span>
                    </div>
                    <div class="db-content" style="color: var(--text-muted)">
                        No strong literature associations or evidence annotations are documented for this medication in PharmGKB.
                    </div>
                </div>
            `;
        }

        recommendationContent.innerHTML = `
            <div class="recommendation-box fade-in">
                <div class="rec-header" style="flex-direction: column; align-items: flex-start; gap: 0.25rem;">
                    <div class="rec-drug-name">> ${rec.drugName}</div>
                    <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">
                        IDENTIFIER: RxNorm CUI ${rec.rxnorm} | PATIENT_PROFILE: ${phenoSummary}
                    </div>
                </div>
                
                <div class="db-grid">
                    ${cpicCard}
                    ${dpwgCard}
                    ${fdaCard}
                    ${pgkbCard}
                </div>
                
                <div style="margin-top: 2rem; text-align: center;">
                    <a href="${guidelineUrl}" target="_blank" class="mode-btn" style="text-decoration: none; display: inline-block;">
                        [ OPEN EXTERNAL CLINICAL GUIDELINES ]
                    </a>
                </div>
            </div>
        `;
    }

    // Start application
    init();
});
