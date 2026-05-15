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
            { text: "INITIALIZING PGx_PRECISION.EXE...", status: "load" },
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
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            
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

            const matched = allDrugs.filter(d => d.name.toLowerCase().includes(query));
            renderSearchResults(matched, query);
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
            // Cap at 20 results for performance
            const limited = results.slice(0, 20);
            limited.forEach(drug => {
                const item = document.createElement('div');
                item.className = 'search-result-item';
                item.innerHTML = `
                    <div class="search-result-name">${highlightMatch(drug.name, query)}</div>
                    <div class="search-result-genes">REQUIRES_GENES: [${drug.geneList.join(', ')}]</div>
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
        
        // Show loading state for inputs
        geneticInputsContainer.innerHTML = '<div class="placeholder-text">> ESTABLISHING CONNECTION TO CPIC... <span class="blink">_</span></div>';
        recommendationContent.innerHTML = `
            <div class="empty-state fade-in">
                <div class="empty-icon">[?]</div>
                <p>> AWAITING GENETIC INPUT FOR ${drug.name.toUpperCase()}</p>
            </div>`;
        
        await renderGeneticInputs(drug);
        updateRecommendation();
    }

    async function renderGeneticInputs(drug) {
        geneticInputsContainer.innerHTML = '';
        const genes = drug.geneList;

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
                <p>> QUERYING CPIC GUIDELINES DATABASE... <span class="blink">_</span></p>
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

        const recommendation = await fetchRecommendation(selectedDrug.rxnorm, lookupKeys);
        const recFormatted = formatCPICRecommendation(selectedDrug, recommendation, phenotypes);
        renderRecommendationUI(recFormatted);
    }

    function renderRecommendationUI(rec) {
        const riskLevel = rec.type === 'danger' ? 'HIGH' : (rec.type === 'warning' ? 'MODERATE' : 'LOW');
        const guidelineUrl = selectedDrug.guidelineId ? `https://cpicpgx.org/guidelines/guideline-for-${selectedDrug.name.toLowerCase().replace(/ /g, '-')}/` : 'https://cpicpgx.org/guidelines/';

        recommendationContent.innerHTML = `
            <div class="recommendation-box fade-in">
                <div class="rec-header">
                    <div>
                        <div class="rec-drug-name">> ${rec.drugName}</div>
                        <div class="rec-class">  ${rec.drugClass}</div>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;">
                        <div class="action-badge ${rec.actionClass}">[ ${rec.action} ]</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted)">RISK_LEVEL: ${riskLevel}</div>
                    </div>
                </div>
                <div class="rec-body">
                    <div class="rec-text ${rec.type}">
                        ${rec.text}
                    </div>
                    <h3>> CLINICAL_IMPLICATIONS</h3>
                    <ul class="implications-list">
                        ${rec.implications.map(imp => `<li>${imp}</li>`).join('')}
                    </ul>
                    
                    <div style="margin-top: 2rem; text-align: center;">
                        <a href="${guidelineUrl}" target="_blank" class="mode-btn" style="text-decoration: none; display: inline-block;">
                            [ VIEW FULL CPIC GUIDELINE ]
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    // Start application
    init();
});
