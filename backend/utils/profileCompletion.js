// Profile Completion Calculator Utility

const calculateCompletion = (employee) => {
    // Define weights for each section
    const weights = {
        personal: 10,
        contact: 10,
        compliance: 25, // Critical for India
        bank: 20,       // Critical for Payroll
        documents: 10,
        education: 15,
        additional: 10
    };

    // Track detailed breakdown
    const sections = {
        personal: { filled: 0, total: 8, score: 0 },
        contact: { filled: 0, total: 6, score: 0 },
        compliance: { filled: 0, total: 10, score: 0 },
        bank: { filled: 0, total: 8, score: 0 },
        documents: { filled: 0, total: 6, score: 0 },
        education: { filled: 0, total: 5, score: 0 },
        additional: { filled: 0, total: 4, score: 0 }
    };

    // Helper to check if value exists
    const has = (val) => val && val.toString().trim() !== '';

    // 1. Personal Information (Total: 8)
    if (has(employee.first_name)) sections.personal.filled++;
    if (has(employee.last_name)) sections.personal.filled++;
    if (has(employee.email)) sections.personal.filled++; // Username
    if (has(employee.gender)) sections.personal.filled++;
    if (has(employee.date_of_birth)) sections.personal.filled++;
    if (has(employee.marital_status)) sections.personal.filled++;
    if (has(employee.blood_group)) sections.personal.filled++;
    if (has(employee.nationality)) sections.personal.filled++;

    // 2. Contact Details (Total: 6)
    // Check address JSONB
    const addr = employee.address || {};
    if (has(employee.phone_number)) sections.contact.filled++;
    if (has(employee.personal_email)) sections.contact.filled++;
    if (has(addr.current_street)) sections.contact.filled++;
    if (has(addr.current_city)) sections.contact.filled++;
    if (has(addr.current_state)) sections.contact.filled++;
    if (has(addr.current_pincode)) sections.contact.filled++;

    // 3. Indian Compliance (Total: 10) - CRITICAL
    if (has(employee.pan_number)) sections.compliance.filled++;
    if (has(employee.aadhaar_number)) sections.compliance.filled++;
    if (has(employee.uan_number)) sections.compliance.filled++;
    if (has(employee.pf_account_number)) sections.compliance.filled++;
    if (has(employee.esi_number)) sections.compliance.filled++; // Optional but counted
    if (has(employee.pan_aadhaar_linked)) sections.compliance.filled++;
    if (has(employee.tax_regime)) sections.compliance.filled++;
    // Some logic for optional fields to avoid penalizing nulls if not applicable? 
    // For simplicity, we assume robust completion means filling N/A if not applicable
    // But let's be lenient on optional ones:
    sections.compliance.total = 5; // Basic critical ones
    // Recount criticals only
    sections.compliance.filled = 0;
    if (has(employee.pan_number)) sections.compliance.filled++;
    if (has(employee.aadhaar_number)) sections.compliance.filled++;
    if (has(employee.pf_account_number)) sections.compliance.filled++;
    if (has(employee.tax_regime)) sections.compliance.filled++;
    if (has(employee.pan_aadhaar_linked)) sections.compliance.filled++;

    // 4. Bank Details (Total: 8) - CRITICAL
    sections.bank.total = 4; // Basic critical
    sections.bank.filled = 0;
    if (has(employee.bank_name)) sections.bank.filled++;
    if (has(employee.bank_account_number)) sections.bank.filled++;
    if (has(employee.bank_ifsc_code)) sections.bank.filled++;
    if (has(employee.account_holder_name)) sections.bank.filled++;

    // 5. Identity Documents (Total: 6)
    if (has(employee.passport_number)) sections.documents.filled++;
    if (has(employee.driving_license_number)) sections.documents.filled++;
    // Adjust total as these are optional usually
    sections.documents.total = 2;

    // 6. Education (Total: 5)
    const edu = employee.education_qualifications || [];
    sections.education.total = 1;
    if (Array.isArray(edu) && edu.length > 0) sections.education.filled = 1;

    // 7. Additional (Total: 4)
    sections.additional.total = 1;
    if (has(employee.skills) || (employee.preferences && employee.preferences.skills)) sections.additional.filled = 1;

    // Calculate Scores per section
    let totalPercentage = 0;

    for (const key of Object.keys(sections)) {
        const sec = sections[key];
        // Cap filled at total
        const filled = Math.min(sec.filled, sec.total);
        const percentage = (filled / sec.total);
        sec.score = Math.round(percentage * 100);

        // Add weighted score
        totalPercentage += percentage * weights[key];
    }

    return {
        total: Math.round(totalPercentage),
        breakdown: {
            personal: sections.personal.score,
            contact: sections.contact.score,
            compliance: sections.compliance.score,
            bank: sections.bank.score,
            documents: sections.documents.score,
            education: sections.education.score,
            additional: sections.additional.score
        }
    };
};

module.exports = { calculateCompletion };
