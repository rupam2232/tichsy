/**
 * Utility to export an array of key-value objects to a CSV file in the browser.
 *
 * @param data Array of objects representing the rows of the CSV.
 * @param filename The desired filename for the downloaded CSV (e.g., "report.csv").
 */
export function exportToCsv<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
) {
  if (!data || !data.length) {
    console.warn("No data provided to exportToCsv");
    return;
  }

  // Extract headers
  const firstRow = data[0];
  if (!firstRow) return;
  const headers = Object.keys(firstRow);

  // Build CSV string
  const csvRows = [];

  // 1. Add Header row
  csvRows.push(
    headers
      .map((header) => `"${String(header).replace(/"/g, '""')}"`)
      .join(","),
  );

  // 2. Add Data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      // Convert value to string and escape existing quotes
      const stringValue =
        value === null || value === undefined ? "" : String(value);
      return `"${stringValue.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(","));
  }

  const csvString = csvRows.join("\n");

  // Prepend the UTF-8 Byte Order Mark (BOM) so Excel decodes characters like '₹' correctly
  const blob = new Blob(["\uFEFF" + csvString], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
