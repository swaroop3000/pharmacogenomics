# PGx_PRECISION
### Multi-Database Pharmacogenomics Mainframe
**Jyothi Swaroop Javangula** [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/jjswaroop)

A real-time, evidence-based pharmacogenomics application designed for clinicians. This tool integrates live API endpoints and structured local databases to deliver comparative clinical dosing recommendations from five global authorities: **CPIC (USA)**, **DPWG (Netherlands)**, **FDA (Regulatory Labels)**, **PharmGKB (Evidence Levels)**, and **CPNDS (Canada)**.

## ⚡ Is this a Real-Time Application?
**Yes!** The application leverages a hybrid data architecture:
* **Live CPIC REST API Integration**: Queries real-time guidelines, variant-to-phenotype mappings, and allele lists for CPIC-supported drugs.
* **Live NIH RxNorm API Integration**: Uses fuzzy term matching (`approximateTerm` endpoint) to resolve drug generic/brand names to standard RxCUIs, expanding search autocomplete to non-CPIC medications.
* **Consolidated local PGx Evidence Database**: Incorporates a curated, structured clinical annotation catalog for DPWG recommendations, FDA boxed warnings, PharmGKB evidence levels, and CPNDS guidelines (e.g. for Clopidogrel, Warfarin, Prasugrel, Ticagrelor, Simvastatin, Ibuprofen, Aspirin, etc.).

## ⚙️ How It Works
The application architecture operates as a dynamic, client-side pipeline:

1. **Initialization (`/pair`)**: On startup, the app pre-fetches CPIC's actionable drug-gene pairs to speed up local indexing.
2. **Medication Search**: When a user inputs a query, the search box queries both the local CPIC drug list and the NIH RxNorm REST API with a 300ms debounce. If a medication has clinical evidence, it is flagged as `[PGx ACTIONABLE]`.
3. **Variant Retrieval (`/allele`)**: Selecting a PGx-actionable drug (e.g., Clopidogrel) prompts the system to fetch valid alleles (e.g., `*1`, `*2`, `*17`) for its corresponding gene (e.g., `CYP2C19`).
4. **Phenotype Resolution (`/diplotype`)**: When the clinician inputs two alleles, the system resolves the patient's metabolizer status (e.g., "CYP2C19 Poor Metabolizer").
5. **Comparative Clinical Recommendation**: The controller aggregates the inputs and queries all available databases, rendering a side-by-side comparative grid:
   * **CPIC (USA)**: Personalized dosing guidelines, clinical implications, and recommendations.
   * **DPWG (Netherlands)**: Dosing rules and alternatives from the Dutch Pharmacogenetics Working Group.
   * **FDA (USA)**: Specific warnings, precautions, or genetic testing requirements present on FDA labeling.
   * **PharmGKB (Academic)**: Clinical annotations and literature evidence grading levels (e.g., Level 1A).
   * **CPNDS (Canada)**: Dosing guidelines and pediatric safety recommendations from the Canadian Pharmacogenomics Network for Drug Safety.

## 🎨 Aesthetic
The UI is built entirely with vanilla HTML, CSS, and JavaScript. It features a retro MS-DOS / CRT Terminal design, complete with phosphor green text, a CSS-based scanline overlay, and sharp terminal borders, invoking the feel of a high-tech medical mainframe.

## 🚀 Running Locally
To run this application, you simply need to open `index.html` in any modern web browser. No complex build tools, package managers, or backend servers are required, as the application natively handles Cross-Origin Resource Sharing (CORS) directly.

## 📚 Data Sources
* [CPIC REST API](https://api.cpicpgx.org/v1/): Live clinical pharmacogenetics implementation consortium guidelines.
* [NIH RxNorm API](https://rxnav.nlm.nih.gov/): Live drug vocabulary and identification standard.
* **Dutch Pharmacogenetics Working Group (DPWG)**: Standard clinical dosing guidelines.
* **PharmGKB**: Clinical annotation database and evidence tier levels.
* **U.S. Food and Drug Administration (FDA)**: Product label warnings and genomic biomarkers table.
* **Canadian Pharmacogenomics Network for Drug Safety (CPNDS)**: Pediatric and adult safety dosing guidelines.
