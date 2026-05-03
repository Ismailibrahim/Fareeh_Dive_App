import { PDFDocument } from 'pdf-lib';

export interface CustomerData {
    full_name: string;
    date_of_birth?: string;
    gender?: string;
    nationality?: string;
    passport_no?: string;
    address?: string;
    city?: string;
    country?: string;
    email?: string;
    phone?: string;
}

export const fillPDF = async (pdfUrl: string, customer: CustomerData) => {
    try {
        // Fetch the existing PDF
        const response = await fetch(pdfUrl);
        const pdfBytes = await response.arrayBuffer();

        // Load the PDFDocument
        const pdfDoc = await PDFDocument.load(pdfBytes);

        // Get the form containing all fields
        const form = pdfDoc.getForm();

        // Debug: Log all field names to help mapping
        const fields = form.getFields();
        console.log('PDF Fields:', fields.map(f => f.getName()));

        // Helper to safely set field value
        const setField = (name: string, value: string | undefined) => {
            if (!value) return;
            try {
                const field = form.getTextField(name);
                field.setText(value);
            } catch (e) {
                // Field might not exist or might not be a text field
                console.warn(`Could not set field ${name}:`, e);
            }
        };

        // Common mapping attempts (case-insensitive and partial matches are hard with getTextField, 
        // so we use specific names if known or try common ones)
        
        // Document-specific field mappings based on extracted field names
        const filename = pdfUrl.split('/').pop() || '';
        
        if (filename.includes('10346 Diver Medical Form')) {
            const medicalMappings = [
                { field: 'Participant Name Print', value: customer.full_name },
                { field: 'Participant Name', value: customer.full_name },
                { field: 'Participant Name2', value: customer.full_name },
                { field: 'Birthdate', value: customer.date_of_birth },
                { field: 'Birthdate2', value: customer.date_of_birth },
                { field: 'Birthdate ddmmyyyy', value: customer.date_of_birth },
                { field: 'Email', value: customer.email },
                { field: 'Phone', value: customer.phone },
                { field: 'Adress', value: customer.address },
                { field: 'Date', value: new Date().toLocaleDateString() },
                { field: 'Date ddmmyyyy', value: new Date().toLocaleDateString() },
            ];
            medicalMappings.forEach(m => setField(m.field, m.value));
        } else if (filename.includes('10072 Release of Liability')) {
            const liabilityMappings = [
                { field: 'Text1', value: customer.full_name }, // Often the first text field is Name
                { field: 'Date Day  Month  Year', value: new Date().toLocaleDateString() },
                { field: 'Date Day  Month  Year_2', value: new Date().toLocaleDateString() },
            ];
            liabilityMappings.forEach(m => setField(m.field, m.value));
        } else if (filename.includes('10060 Standard Safe Diving Practices')) {
            const safeDivingMappings = [
                { field: 'PRINT NAME', value: customer.full_name },
                { field: 'Date DayMonthYear', value: new Date().toLocaleDateString() },
                { field: 'Date DayMonthYear_2', value: new Date().toLocaleDateString() },
            ];
            safeDivingMappings.forEach(m => setField(m.field, m.value));
        }

        // Common mapping attempts for any other PDFs
        const commonMappings = [
            { field: 'Name', value: customer.full_name },
            { field: 'Full Name', value: customer.full_name },
            { field: 'FullName', value: customer.full_name },
            { field: 'DateOfBirth', value: customer.date_of_birth },
            { field: 'DOB', value: customer.date_of_birth },
            { field: 'Gender', value: customer.gender },
            { field: 'Nationality', value: customer.nationality },
            { field: 'PassportNo', value: customer.passport_no },
            { field: 'Address', value: customer.address },
            { field: 'Email', value: customer.email },
            { field: 'Phone', value: customer.phone },
        ];

        commonMappings.forEach(m => setField(m.field, m.value));

        // Serialize the PDFDocument to bytes (a Uint8Array)
        const filledPdfBytes = await pdfDoc.save();

        // Create a blob and download
        const blob = new Blob([filledPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Ensure filename ends with .pdf
        let downloadName = filename.replace('.pdf', '');
        link.download = `Filled_${downloadName}.pdf`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error('Error filling PDF:', error);
        return false;
    }
};
