# PGx_PRECISION.EXE
### Stroke Medication Dosing Terminal
**Jyothi Swaroop Javangula**

A real-time, evidence-based pharmacogenomics application designed for clinicians. This tool connects directly to the **Clinical Pharmacogenetics Implementation Consortium (CPIC)** databases to provide personalized dosing recommendations based on patient genetic variants (diplotypes).

## ⚡ Is this a Real-Time Application?
**Yes!** This application does *not* rely on static, hardcoded datasets for its clinical recommendations. Every time you use the tool, it queries the live CPIC REST API. This ensures that the clinical guidelines, variant-to-phenotype mappings, and actionable drugs are always up-to-date with the latest scientific consensus.

## ⚙️ How It Works
The application architecture follows a dynamic pipeline:

1. **Initialization (`/pair`)**: On startup, the app queries CPIC to retrieve drug-gene pairs with actionable guidelines. It uses a join query with resource embedding to fetch drug names efficiently, bypassing restricted views.
2. **Variant Retrieval (`/allele`)**: When a clinician selects a drug (e.g., Clopidogrel), the app queries the database for the specific gene required (e.g., CYP2C19) and fetches all known valid alleles (e.g., `*1`, `*2`, `*17`).
3. **Phenotype Resolution (`/diplotype`)**: Once the clinician inputs two alleles (a diplotype), the app sends this combination back to CPIC to instantly resolve the patient's metabolic status (e.g., "Poor Metabolizer").
4. **Clinical Recommendation (`/recommendation`)**: Using the resolved metabolic status, the app securely queries the CPIC guidelines database to surface specific dosage adjustments, clinical implications, and alternatives (e.g., "Avoid Clopidogrel, consider Prasugrel").

## 🎨 Aesthetic
The UI is built entirely with vanilla HTML, CSS, and JavaScript. It features a retro MS-DOS / CRT Terminal design, complete with phosphor green text, a CSS-based scanline overlay, and sharp terminal borders, invoking the feel of a high-tech medical mainframe.

## 🚀 Running Locally
To run this application, you simply need to open `index.html` in any modern web browser. No complex build tools or backend servers are required, as the application natively handles Cross-Origin Resource Sharing (CORS) directly with the CPIC API.

## 📚 Data Source
All data is dynamically sourced from the [CPIC API](https://api.cpicpgx.org/v1/). CPIC provides peer-reviewed, evidence-based guidelines to help clinicians understand how genetic test results should be used to optimize drug therapy.
