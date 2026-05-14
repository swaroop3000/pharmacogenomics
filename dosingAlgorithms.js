// CPIC Real-time API configuration
const CPIC_BASE_URL = 'https://api.cpicpgx.org/v1';

// Async function to fetch all actionable drugs from CPIC
async function fetchAllActionableDrugs() {
    try {
        // Fetch all drug-gene pairs where the gene is required for a recommendation
        const response = await fetch(`${CPIC_BASE_URL}/pair_view?usedforrecommendation=eq.Yes`);
        const data = await response.json();
        
        // Group by drugid (RxNorm)
        const drugMap = {};
        for (const item of data) {
            if (!drugMap[item.drugid]) {
                drugMap[item.drugid] = {
                    id: item.drugid,
                    rxnorm: item.drugid,
                    name: item.drugname.charAt(0).toUpperCase() + item.drugname.slice(1),
                    genes: new Set(),
                    hasPGx: true
                };
            }
            drugMap[item.drugid].genes.add(item.genesymbol);
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
        const response = await fetch(`${CPIC_BASE_URL}/recommendation?drugid=eq.${rxnormId}`);
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

// Format the CPIC API response into our UI format
function formatCPICRecommendation(drug, recommendation, phenotypes) {
    if (!recommendation) {
        return {
            drugName: drug.name,
            drugClass: drug.gene + ' Guideline',
            action: 'Unknown Variant',
            actionClass: 'action-info',
            text: `No specific CPIC recommendation found for the entered diplotypes.`,
            implications: [
                'Please verify the genetic test results.',
                'Consult a clinical pharmacist or clinical geneticist.',
                'Default to cautious standard dosing and careful monitoring.'
            ],
            type: 'info'
        };
    }

    let action = 'Standard Dosing';
    let actionClass = 'action-standard';
    let type = 'standard';

    const text = recommendation.drugrecommendation || "";
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
    } else if (recommendation.classification === 'Strong' && !lowerText.includes('standard')) {
        action = 'Actionable';
        actionClass = 'action-info';
        type = 'info';
    }

    const implicationsList = [];
    if (recommendation.implications) {
        for (const [gene, implication] of Object.entries(recommendation.implications)) {
            implicationsList.push(`<b>${gene}:</b> ${implication}`);
        }
    }
    if (recommendation.comments) {
        implicationsList.push(`Note: ${recommendation.comments}`);
    }
    
    const phenoSummary = Object.entries(phenotypes).map(([g, p]) => `<b>${g}</b>: ${p}`).join(', ');

    return {
        drugName: drug.name,
        drugClass: drug.gene + ' Guideline',
        action: action,
        actionClass: actionClass,
        text: `Patient phenotype: ${phenoSummary}. <br><br><strong>CPIC Guideline:</strong> ${text}`,
        implications: implicationsList.length > 0 ? implicationsList : ['See CPIC guidelines for full details.'],
        type: type
    };
}

function getNonPGxRecommendation(drug) {
    return {
        drugName: drug.name,
        drugClass: 'No CPIC Guidelines',
        action: 'Standard Dosing',
        actionClass: 'action-standard',
        text: 'There are currently no actionable CPIC pharmacogenomic guidelines for this medication.',
        implications: [
            'Proceed with standard age and weight-based dosing.',
            'Monitor patient clinical response normally.'
        ],
        type: 'info'
    };
}
