// CPIC Real-time API configuration
const CPIC_BASE_URL = 'https://api.cpicpgx.org/v1';

// Async function to fetch all actionable drugs from CPIC
async function fetchAllActionableDrugs() {
    try {
        // Fetch all drug-gene pairs where the gene is required for a recommendation
        // We use the /pair endpoint with resource embedding for drug names because /pair_view is restricted
        const response = await fetch(`${CPIC_BASE_URL}/pair?usedforrecommendation=eq.true&select=genesymbol,drugid,drug(name,guidelineid)`);
        const data = await response.json();
        
        // Group by drugid (RxNorm)
        const drugMap = {};
        for (const item of data) {
            if (!item.drugid) continue;
            const drugId = item.drugid.replace(/^RxNorm:/i, '');
            const drugName = item.drug ? item.drug.name : 'Unknown Drug';
            const guidelineId = item.drug ? item.drug.guidelineid : null;
            
            if (!drugMap[drugId]) {
                drugMap[drugId] = {
                    id: drugId,
                    rxnorm: drugId,
                    name: drugName.charAt(0).toUpperCase() + drugName.slice(1),
                    guidelineId: guidelineId,
                    genes: new Set(),
                    hasPGx: true
                };
            }
            drugMap[drugId].genes.add(item.genesymbol);
        }

        // Convert sets to arrays and return sorted list
        return Object.values(drugMap).map(d => {
            d.gene = Array.from(d.genes).join('_');
            d.geneList = Array.from(d.genes);
            delete d.genes;
            return d;
        }).sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
        console.error('Error fetching drugs', error);
        return [];
    }
}

// Async function to fetch alleles for a given gene
async function fetchAlleles(gene) {
    try {
        const response = await fetch(`${CPIC_BASE_URL}/allele?genesymbol=eq.${gene}&select=name`);
        const data = await response.json();
        return data.map(d => d.name);
    } catch (error) {
        console.error('Error fetching alleles for', gene, error);
        return [];
    }
}

// Async function to lookup phenotype given diplotype alleles
async function lookupPhenotype(gene, allele1, allele2) {
    try {
        const diplotype1 = encodeURIComponent(`${allele1}/${allele2}`);
        const diplotype2 = encodeURIComponent(`${allele2}/${allele1}`);
        const query = (allele1 === allele2) ? `eq.${diplotype1}` : `in.(${diplotype1},${diplotype2})`;
        
        const response = await fetch(`${CPIC_BASE_URL}/diplotype?genesymbol=eq.${gene}&diplotype=${query}`);
        const data = await response.json();
        
        if (data && data.length > 0) {
            return data[0]; // Returns the diplotype object which contains generesult (phenotype) and lookupkey
        }
        return null;
    } catch (error) {
        console.error('Error fetching phenotype', error);
        return null;
    }
}

// Async function to fetch recommendations based on lookup keys
async function fetchRecommendation(rxnormId, lookupKeys) {
    try {
        const queryId = rxnormId.startsWith('RxNorm:') ? rxnormId : `RxNorm:${rxnormId}`;
        const response = await fetch(`${CPIC_BASE_URL}/recommendation?drugid=eq.${queryId}`);
        const recommendations = await response.json();
        
        // Find a matching recommendation
        const matched = recommendations.find(rec => {
            if (!rec.lookupkey) return false;
            
            let isMatch = true;
            for (const gene of Object.keys(lookupKeys)) {
                if (rec.lookupkey[gene] && rec.lookupkey[gene] !== lookupKeys[gene]) {
                    isMatch = false;
                    break;
                }
            }
            return isMatch;
        });

        return matched || null;
    } catch (error) {
        console.error('Error fetching recommendations', error);
        return null;
    }
}

// Async function to search RxNorm API for drug names and match them with CPIC/PGx guidelines
async function searchRxNormDrugs(query, cpicDrugs) {
    try {
        // Step 1: Filter CPIC drugs locally
        const cpicMatched = cpicDrugs.filter(d => d.name.toLowerCase().includes(query.toLowerCase()));
        
        // Step 2: Query RxNorm API for a broader search
        const response = await fetch(`https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(query)}&maxEntries=10`);
        const data = await response.json();
        
        const candidates = data.approximateGroup ? data.approximateGroup.candidate : [];
        const rxNormMatched = [];
        const nameMap = new Map(); // rxcui -> name
        
        if (candidates && candidates.length > 0) {
            // Group candidates by rxcui and resolve names
            for (const cand of candidates) {
                if (cand.rxcui) {
                    const rxcui = cand.rxcui;
                    const name = cand.name;
                    
                    // Prioritize candidates with names, and keep the most complete name
                    if (name && (!nameMap.has(rxcui) || nameMap.get(rxcui).length < name.length)) {
                        nameMap.set(rxcui, name);
                    } else if (!nameMap.has(rxcui)) {
                        // Fallback if no name found yet
                        nameMap.set(rxcui, "");
                    }
                }
            }
            
            for (const [rxcui, rawName] of nameMap.entries()) {
                // If we couldn't resolve a name, use a default fallback from local or query
                let name = rawName;
                if (!name) {
                    const localEvidence = PGx_EVIDENCE_DATABASE[rxcui];
                    name = localEvidence ? localEvidence.name : query;
                }
                
                // Clean name (RxNorm names can be capitalized/formatted weirdly)
                const cleanName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
                
                // Check if already in CPIC list
                const cpicDrug = cpicDrugs.find(d => d.rxnorm === rxcui);
                if (cpicDrug) {
                    continue; // Skip to avoid duplicates
                }
                
                // Check if in local evidence database
                const hasLocalEvidence = !!PGx_EVIDENCE_DATABASE[rxcui];
                let geneList = [];
                if (hasLocalEvidence) {
                    if (rxcui === '731110' || rxcui === '613391' || rxcui === '1116632') { // Prasugrel, Ticagrelor
                        geneList = ['CYP2C19'];
                    } else if (rxcui === '1191') { // Aspirin
                        geneList = [];
                    } else {
                        geneList = ['CYP2D6']; // default mapping for local
                    }
                }
                
                rxNormMatched.push({
                    id: rxcui,
                    rxnorm: rxcui,
                    name: cleanName,
                    guidelineId: null,
                    geneList: geneList,
                    hasPGx: hasLocalEvidence
                });
            }
        }
        
        // Step 3: Combine lists (local CPIC matches first, then RxNorm matches)
        const combined = [...cpicMatched];
        for (const item of rxNormMatched) {
            if (!combined.some(c => c.rxnorm === item.rxnorm)) {
                combined.push(item);
            }
        }
        
        return combined.slice(0, 20); // Cap at 20 results
    } catch (error) {
        console.error('Error searching RxNorm', error);
        // Fallback to local filter only
        return cpicDrugs.filter(d => d.name.toLowerCase().includes(query.toLowerCase())).slice(0, 20);
    }
}

// Fetch and consolidate all evidence for a drug-gene pair
async function getConsolidatedPGxEvidence(drug, lookupKeys, phenotypes) {
    const rxnorm = drug.rxnorm;
    
    // 1. Fetch CPIC Recommendation dynamically if guideline exists
    let cpicRec = null;
    if (drug.guidelineId) {
        cpicRec = await fetchRecommendation(rxnorm, lookupKeys);
    }
    
    // 2. Fetch local annotations from PGx_EVIDENCE_DATABASE
    const localEvidence = PGx_EVIDENCE_DATABASE[rxnorm];
    
    // If no evidence is found in CPIC or local DB, default to standard non-PGx recommendation
    if (!cpicRec && !localEvidence) {
        return getNonPGxRecommendation(drug);
    }
    
    // Format CPIC recommendation
    let cpicFormatted = null;
    if (cpicRec) {
        let action = 'Standard Dosing';
        let actionClass = 'action-standard';
        let type = 'standard';
        const text = cpicRec.drugrecommendation || "";
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes('avoid') || lowerText.includes('alternative') || lowerText.includes('extreme caution')) {
            action = 'Avoid / Alternative';
            actionClass = 'action-avoid';
            type = 'danger';
        } else if (lowerText.includes('reduce dose') || lowerText.includes('caution') || lowerText.includes('decrease') || lowerText.includes('lower dose')) {
            action = 'Caution / Adjust Dose';
            actionClass = 'action-caution';
            type = 'warning';
        } else if (lowerText.includes('increase dose')) {
            action = 'Increase Dose';
            actionClass = 'action-caution';
            type = 'warning';
        } else if (cpicRec.classification === 'Strong' && !lowerText.includes('standard')) {
            action = 'Actionable';
            actionClass = 'action-info';
            type = 'info';
        }

        const implicationsList = [];
        if (cpicRec.implications) {
            for (const [gene, implication] of Object.entries(cpicRec.implications)) {
                implicationsList.push(`<b>${gene}:</b> ${implication}`);
            }
        }
        if (cpicRec.comments) {
            implicationsList.push(`Note: ${cpicRec.comments}`);
        }

        cpicFormatted = {
            action: action,
            actionClass: actionClass,
            text: text,
            implications: implicationsList.length > 0 ? implicationsList : ['See CPIC guidelines for full details.'],
            type: type
        };
    }
    
    return {
        drugName: drug.name,
        rxnorm: rxnorm,
        geneList: drug.geneList,
        phenotypes: phenotypes,
        cpic: cpicFormatted,
        dpwg: localEvidence ? localEvidence.dpwg : null,
        fda: localEvidence ? localEvidence.fda : null,
        pharmgkb: localEvidence ? localEvidence.pharmgkb : null
    };
}

function getNonPGxRecommendation(drug) {
    return {
        drugName: drug.name,
        rxnorm: drug.rxnorm,
        geneList: [],
        phenotypes: {},
        cpic: null,
        dpwg: {
            action: "Standard Dosing",
            actionClass: "action-standard",
            text: "No genetic adjustments required. Default to standard therapeutic guidelines."
        },
        fda: {
            warningType: "No PGx Warning",
            warningClass: "action-standard",
            text: "No pharmacogenomic warning or dosing guidelines present on the FDA drug label."
        },
        pharmgkb: {
            level: "Level 4",
            text: "No strong clinical association or evidence linking genetic variants to drug response."
        }
    };
}
