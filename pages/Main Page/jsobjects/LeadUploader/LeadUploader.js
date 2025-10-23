export default {
	async uploadLeadsToSheets() {
		try {
			// 1️⃣ Get all leads from your Flask API
			const leads = SendFileToApi.data.results;

			// 2️⃣ Map sheet IDs to Visit Types
			const sheetMap = {
				ProductionSheetBranch:
				"https://docs.google.com/spreadsheets/d/1_-gbqbLO5pHnsVU6UYUWS8kk_CUVUy23qriesAusvvM/edit",
				ProductionSheetVisit:
				"https://docs.google.com/spreadsheets/d/194HJfn_4Yfgxa2KbegDFdNkKs7R2hAFVy01boL45bo0/edit",
			};

			// 3️⃣ Prepare batch grouping { sheetURL: { tabName: [rows] } }
			const batches = {};

			for (let lead of leads) {
				const visitType = lead["Visit Type"];
				const governrate = lead["Governrate"];

				// Decide which spreadsheet to use
				const spreadsheet =
							visitType === "Branch"
				? sheetMap.ProductionSheetBranch
				: sheetMap.ProductionSheetVisit;

				// Determine tab (sheet) name
				let tabName = "";
				if (visitType === "Branch") {
					// Each governorate has its own tab
					tabName = ['Cairo', 'Giza','Alex','Tanta','Hurghada'].includes(governrate)
						? governrate
					: "Governrate";
				} else {
					// Visits sheet: Cairo & Giza have their own tabs, rest go to "Governrate"
					tabName = ["Cairo", "Giza"].includes(governrate)
						? governrate
					: "Governrate";
				}

				// Construct row object (keys = column headers)
				const row = {
					"Customer ID": lead["Customer ID"],
					Name: lead["Name"],
					"Mobile No": lead["Mobile No"],
					Address: lead["Address"],
					Governrate: lead["Governrate"],
					"Visit Type": lead["Visit Type"],
					Limit: lead["Limit"],
					Comment: lead["Comment"],
					Date: lead["Date"],
					"Visit Date": lead["Visit Date"],
					processed_at: lead["processed_at"],
				};

				// Create grouping structure
				if (!batches[spreadsheet]) batches[spreadsheet] = {};
				if (!batches[spreadsheet][tabName]) batches[spreadsheet][tabName] = [];
				batches[spreadsheet][tabName].push(row);
			}

			// 4️⃣ Loop through batches and append per tab (one API call per tab)
			for (const [spreadsheet, tabs] of Object.entries(batches)) {
				for (const [tabName, rows] of Object.entries(tabs)) {
					await googleSheetsAppend.run({
						spreadsheet,
						sheetName: tabName,
						values: rows,
					});
				}
			}

			showAlert("✅ All leads uploaded successfully!", "success");
		} catch (error) {
			console.error(error);
			showAlert("❌ Upload failed: " + error.message, "error");
		}
	},
};
