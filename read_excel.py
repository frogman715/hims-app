import xlrd

# Load the Excel file
wb = xlrd.open_workbook('/home/docter203/hanmarine_hims/hims-app/forms_reference/principals/lundqvist_rederierna/HGF-CR-02 APPLICATION FOR EMPLOYMENT-TANKER .xls')

print('Sheets:', wb.sheet_names())

# Read each sheet
for sheet_idx in range(wb.nsheets):
    sheet = wb.sheet_by_index(sheet_idx)
    sheet_name = wb.sheet_names()[sheet_idx]
    print(f'\n=== {sheet_name} ===')

    # Read all rows
    for row_idx in range(sheet.nrows):
        row = sheet.row_values(row_idx)
        # Only print rows that have content
        if any(cell for cell in row if cell != ''):
            print(row)