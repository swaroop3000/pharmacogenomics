/**
 * PGx_PRECISION - Pharmacogenomics Local Evidence Database
 * Contains DPWG guidelines, FDA annotations, and PharmGKB evidence levels for major medications.
 * Keys are normalized lower-case generic drug names or RxNorm CUI IDs.
 */

const PGx_EVIDENCE_DATABASE = {
    // Clopidogrel
    "32968": {
        name: "Clopidogrel",
        dpwg: {
            action: "Avoid / Alternative",
            actionClass: "action-avoid",
            text: "For CYP2C19 intermediate and poor metabolizers, select an alternative drug (e.g., prasugrel or ticagrelor). If an alternative is not possible, double the standard maintenance dose of clopidogrel to 150 mg daily."
        },
        fda: {
            warningType: "Boxed Warning",
            warningClass: "action-avoid",
            text: "WARNING: AVOID USE IN POOR METABOLIZERS. Effectiveness of Plavix depends on activation to an active metabolite by the CYP2C19 enzyme. Poor metabolizers exhibit higher cardiovascular event rates."
        },
        pharmgkb: {
            level: "Level 1A",
            text: "CYP2C19 loss-of-function alleles (*2, *3) are strongly associated with reduced active metabolite concentration, reduced platelet inhibition, and a higher risk of major adverse cardiovascular events (including stent thrombosis) compared to normal metabolizers."
        }
    },
    // Warfarin
    "11289": {
        name: "Warfarin",
        dpwg: {
            action: "Caution / Adjust Dose",
            actionClass: "action-caution",
            text: "Adjust the initial dose according to the genotype-guided algorithm (taking CYP2C9 and VKORC1 into account). For patients carrying CYP2C9 *2 or *3 alleles, or the VKORC1 A-allele, a substantial dose reduction is required to avoid over-anticoagulation and bleeding."
        },
        fda: {
            warningType: "Actionable PGx",
            warningClass: "action-caution",
            text: "Dosing recommendations based on CYP2C9 and VKORC1 genotypes are provided in the product label. Consider starting at a lower initiation dose for patients with CYP2C9 or VKORC1 variants."
        },
        pharmgkb: {
            level: "Level 1A",
            text: "CYP2C9, VKORC1, and CYP4F2 genetic variants significantly influence warfarin clearance and sensitivity. Standardized dosing algorithms incorporating these genotypes reduce time to stable therapeutic INR and bleed risk."
        }
    },
    // Simvastatin
    "36567": {
        name: "Simvastatin",
        dpwg: {
            action: "Caution / Adjust Dose",
            actionClass: "action-caution",
            text: "For SLCO1B1 intermediate transporter activity, limit Simvastatin dose to 20 mg/day or select an alternative statin (e.g., Atorvastatin or Rosuvastatin). For low transporter activity, avoid Simvastatin 40 mg/day and 80 mg/day due to high risk of myopathy."
        },
        fda: {
            warningType: "Actionable PGx",
            warningClass: "action-caution",
            text: "Simvastatin exposure is increased in patients with SLCO1B1 genotype variants, increasing risk of myopathy and rhabdomyolysis. Simvastatin 80 mg is contraindicated except in patients who have tolerated it for over 12 months."
        },
        pharmgkb: {
            level: "Level 1A",
            text: "The SLCO1B1 c.521T>C (rs4149056) variant decreases uptake of simvastatin into the liver, resulting in higher systemic concentrations and a dose-dependent risk of statin-induced myopathy."
        }
    },
    // Codeine
    "2670": {
        name: "Codeine",
        dpwg: {
            action: "Avoid / Alternative",
            actionClass: "action-avoid",
            text: "CYP2D6 Poor Metabolizers: Avoid codeine as it lacks analgesic efficacy (inability to metabolize to active morphine). CYP2D6 Ultra-rapid Metabolizers: Avoid codeine due to an increased risk of severe, potentially life-threatening morphine toxicity."
        },
        fda: {
            warningType: "Boxed Warning",
            warningClass: "action-avoid",
            text: "CONTRAINDICATION: Do not use in children under 12 years of age or post-tonsillectomy/adenoidectomy. Avoid use in CYP2D6 ultra-rapid metabolizers due to risk of respiratory depression."
        },
        pharmgkb: {
            level: "Level 1A",
            text: "Codeine is a prodrug requiring conversion to morphine by CYP2D6. Genetic variations leading to non-functional (poor) or duplicated active (ultra-rapid) CYP2D6 enzymes lead to either therapy failure or severe toxicity."
        }
    },
    // Tramadol
    "10689": {
        name: "Tramadol",
        dpwg: {
            action: "Caution / Adjust Dose",
            actionClass: "action-caution",
            text: "CYP2D6 Poor Metabolizers: Efficacy is reduced. Consider alternative pain medication. CYP2D6 Ultra-rapid Metabolizers: Increased risk of side effects. Reduce dose or select an alternative analgesic."
        },
        fda: {
            warningType: "Boxed Warning",
            warningClass: "action-avoid",
            text: "Contraindicated in children under 12 years of age. Avoid use in patients who are CYP2D6 ultra-rapid metabolizers due to risk of respiratory depression."
        },
        pharmgkb: {
            level: "Level 1A",
            text: "CYP2D6 metabolizes tramadol to its active O-desmethyltramadol metabolite. Altered CYP2D6 phenotypes affect pain control efficacy and toxicity risk."
        }
    },
    // Sertraline
    "36437": {
        name: "Sertraline",
        dpwg: {
            action: "Caution / Adjust Dose",
            actionClass: "action-caution",
            text: "CYP2C19 Poor Metabolizers: Reduce starting dose by 50% or select alternative (e.g., fluoxetine). Monitor for increased side effects. CYP2C19 Ultra-rapid Metabolizers: Efficacy may be reduced. Consider alternative antidepressant."
        },
        fda: {
            warningType: "Informational PGx",
            warningClass: "action-standard",
            text: "Sertraline is metabolized primarily by CYP2C19. Poor metabolizers exhibit higher concentrations, which may increase exposure and risk of adverse effects."
        },
        pharmgkb: {
            level: "Level 1A",
            text: "CYP2C19 poor metabolizers exhibit a significantly slower clearance rate of sertraline, leading to elevated plasma levels and higher rates of gastrointestinal and central nervous system side effects."
        }
    },
    // Escitalopram
    "321289": {
        name: "Escitalopram",
        dpwg: {
            action: "Caution / Adjust Dose",
            actionClass: "action-caution",
            text: "CYP2C19 Poor Metabolizers: Limit maximum dose to 10 mg daily (or 50% reduction) due to risk of QT prolongation and side effects. CYP2C19 Ultra-rapid Metabolizers: Efficacy may be reduced; select alternative drug."
        },
        fda: {
            warningType: "Actionable PGx",
            warningClass: "action-caution",
            text: "Escitalopram exposure is increased in CYP2C19 poor metabolizers. Consider dose reduction in poor metabolizers or when co-administered with CYP2C19 inhibitors."
        },
        pharmgkb: {
            level: "Level 1A",
            text: "CYP2C19 genotype variation determines escitalopram metabolism speed. Poor metabolizers have elevated blood concentration and higher risk of QT interval prolongation."
        }
    },
    // Amitriptyline
    "704": {
        name: "Amitriptyline",
        dpwg: {
            action: "Avoid / Alternative",
            actionClass: "action-avoid",
            text: "CYP2D6 or CYP2C19 Poor Metabolizers: Avoid amitriptyline or reduce dose by 50% with therapeutic drug monitoring. CYP2D6 Ultra-rapid Metabolizers: Avoid amitriptyline due to lack of efficacy."
        },
        fda: {
            warningType: "Actionable PGx",
            warningClass: "action-caution",
            text: "Tricyclic antidepressants like amitriptyline should be used with caution in patients known to be CYP2D6 poor metabolizers, as they can reach toxic plasma levels."
        },
        pharmgkb: {
            level: "Level 1A",
            text: "Amitriptyline is demethylated to active nortriptyline via CYP2C19, and both are hydroxylated via CYP2D6. Genetic variation in both genes heavily affects parent/metabolite ratios and cardiotoxicity risk."
        }
    },
    // Prasugrel
    "731110": {
        name: "Prasugrel",
        dpwg: {
            action: "Standard Dosing",
            actionClass: "action-standard",
            text: "No genetic dose adjustment required. CYP2C19 genetic variants do not affect the clinical efficacy or bleeding risk of prasugrel."
        },
        fda: {
            warningType: "Informational PGx",
            warningClass: "action-standard",
            text: "Prasugrel activation is not significantly dependent on CYP2C19. It is an effective alternative antiplatelet for CYP2C19 poor metabolizers."
        },
        pharmgkb: {
            level: "Level 1B",
            text: "Prasugrel is a prodrug activated primarily by CYP3A4 and CYP2B6, with minor contributions from CYP2C9 and CYP2C19. It is unaffected by CYP2C19 poor metabolizer status."
        }
    },
    // Ticagrelor
    "1116632": {
        name: "Ticagrelor",
        dpwg: {
            action: "Standard Dosing",
            actionClass: "action-standard",
            text: "No genetic dose adjustment required. Ticagrelor is an active drug (not a prodrug) and its antiplatelet effect is not affected by CYP2C19 metabolizer status."
        },
        fda: {
            warningType: "No PGx Warning",
            warningClass: "action-standard",
            text: "No pharmacogenomic warning or restrictions. Recommended alternative antiplatelet for patients with loss-of-function CYP2C19 alleles."
        },
        pharmgkb: {
            level: "Level 1A",
            text: "Ticagrelor is a direct-acting reversible P2Y12 receptor antagonist. Efficacy and bleeding rates are identical across normal, intermediate, and poor CYP2C19 metabolizers."
        }
    },
    // Ibuprofen
    "5640": {
        name: "Ibuprofen",
        dpwg: {
            action: "Caution / Adjust Dose",
            actionClass: "action-caution",
            text: "CYP2C9 Poor Metabolizers: Start with 50% of the normal starting dose. Limit maximum dose and monitor for gastrointestinal side effects and renal function."
        },
        fda: {
            warningType: "Actionable PGx",
            warningClass: "action-caution",
            text: "NSAID metabolism is slowed in patients with CYP2C9 poor metabolizer genotypes. Consider initiating treatment at a lower dose."
        },
        pharmgkb: {
            level: "Level 1A",
            text: "CYP2C9 is the primary enzyme responsible for the clearance of ibuprofen. Poor metabolizers (*3/*3) experience significantly higher exposure and risk of gastrointestinal bleeding."
        }
    },
    // Aspirin
    "1191": {
        name: "Aspirin",
        dpwg: {
            action: "Standard Dosing",
            actionClass: "action-standard",
            text: "No genetic dose adjustment required. Standard low-dose aspirin (75-100 mg/day) for secondary cardiovascular prevention remains unaffected by PGx variants."
        },
        fda: {
            warningType: "No PGx Warning",
            warningClass: "action-standard",
            text: "No pharmacogenomic warning or testing requirements in the FDA product labeling."
        },
        pharmgkb: {
            level: "Level 4",
            text: "There is no strong clinical evidence linking common genetic variants to aspirin resistance or efficacy. Standard antiplatelet protocols apply."
        }
    }
};
