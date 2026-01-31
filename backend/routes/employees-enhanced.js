// Employee API Enhancement - Add to backend/routes/employees.js or index.js

// POST /api/employees - Create new employee with enhanced fields
app.post('/api/employees',
    authenticateToken,
    checkRole(ADMIN_ROLES),
    [
        body('first_name').trim().notEmpty().withMessage('First name required'),
        body('last_name').trim().notEmpty().withMessage('Last name required'),
        body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
        body('pan_number').optional().matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/).withMessage('Invalid PAN format'),
        body('bank_ifsc_code').optional().matches(/^[A-Z]{4}0[A-Z0-9]{6}$/).withMessage('Invalid IFSC code'),
        body('aadhaar_number').optional().isLength({ min: 12, max: 12 }).withMessage('Aadhaar must be 12 digits'),
        validateRequest
    ],
    async (req, res) => {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const {
                // Personal Information
                first_name, middle_name, last_name, preferred_name, email, personal_email,
                phone_number, alternate_phone, date_of_birth, gender, marital_status,
                blood_group, nationality,

                // Indian Compliance
                pan_number, aadhaar_number, uan_number, pan_aadhaar_linked, pan_linked_date,
                esi_number, pf_account_number, previous_pf_account, tax_regime, professional_tax_applicable,

                // Bank Details  
                bank_name, bank_account_number, bank_ifsc_code, bank_branch,
                account_holder_name, account_type, payment_method, currency_code,

                // Employment Details
                role_id, department_id, position_id, manager_id, reporting_manager_id,
                hire_date, joining_date, confirmation_date, probation_period_months,
                notice_period_days, employment_type, employee_category, work_location,
                contract_start_date, contract_end_date,

                // Shift Management
                default_shift_id, shift_pattern, work_hours_per_day, work_days_per_week,
                overtime_eligible, weekend_days, flexible_hours_allowed, remote_work_allowed,

                // Salary Components
                salary, basic_salary, hra, special_allowance, transport_allowance,
                medical_allowance, dearness_allowance, other_allowances,
                pf_contribution, esi_contribution, professional_tax, tds_amount,
                annual_bonus, performance_bonus, variable_pay_percentage,

                // Benefits
                gratuity_applicable, leave_policy_id, health_insurance_number,
                health_insurance_provider, health_insurance_expiry,

                // Identity Documents
                passport_number, passport_expiry_date, passport_country,
                driving_license_number, driving_license_expiry, voter_id,

                // JSONB Fields
                address, emergency_contact, education_qualifications, previous_employment,
                preferences
            } = req.body;

            // Generate employee_id if not provided
            const year = new Date().getFullYear();
            const countResult = await client.query(
                'SELECT COUNT(*) as count FROM user_profiles WHERE employee_id LIKE $1',
                [`EMP-${year}-%`]
            );
            const nextNumber = (parseInt(countResult.rows[0].count) + 1).toString().padStart(4, '0');
            const employee_id = `EMP-${year}-${nextNumber}`;

            // Encrypt sensitive data
            const crypto = require('crypto');
            const algorithm = 'aes-256-cbc';
            const key = Buffer.from(process.env.ENCRYPTION_KEY || 'your-32-character-secret-key!!', 'utf8');
            const iv = crypto.randomBytes(16);

            const encryptData = (text) => {
                if (!text) return null;
                const cipher = crypto.createCipheriv(algorithm, key, iv);
                let encrypted = cipher.update(text, 'utf8', 'hex');
                encrypted += cipher.final('hex');
                return iv.toString('hex') + ':' + encrypted;
            };

            const encrypted_aadhaar = aadhaar_number ? encryptData(aadhaar_number) : null;
            const encrypted_bank_account = bank_account_number ? encryptData(bank_account_number) : null;

            // Insert employee
            const result = await client.query(`
        INSERT INTO user_profiles (
          employee_id, first_name, middle_name, last_name, preferred_name,
          email, personal_email, phone_number, alternate_phone,
          date_of_birth, gender, marital_status, blood_group, nationality,
          pan_number, aadhaar_number, uan_number, pan_aadhaar_linked, pan_linked_date,
          esi_number, pf_account_number, previous_pf_account, tax_regime, professional_tax_applicable,
          bank_name, bank_account_number, bank_ifsc_code, bank_branch, 
          account_holder_name, account_type, payment_method, currency_code,
          role_id, department_id, position_id, manager_id, reporting_manager_id,
          hire_date, joining_date, confirmation_date, probation_period_months, notice_period_days,
          employment_type, employee_category, work_location, contract_start_date, contract_end_date,
          default_shift_id, shift_pattern, work_hours_per_day, work_days_per_week,
          overtime_eligible, weekend_days, flexible_hours_allowed, remote_work_allowed,
          salary, basic_salary, hra, special_allowance, transport_allowance,
          medical_allowance, dearness_allowance, other_allowances,
          pf_contribution, esi_contribution, professional_tax, tds_amount,
          annual_bonus, performance_bonus, variable_pay_percentage,
          gratuity_applicable, leave_policy_id, health_insurance_number,
          health_insurance_provider, health_insurance_expiry,
          passport_number, passport_expiry_date, passport_country,
          driving_license_number, driving_license_expiry, voter_id,
          address, emergency_contact, education_qualifications, previous_employment, preferences
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
          $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, 
          $41, $42, $43, $44, $45, $46, $47, $48, $49, $50,
          $51, $52, $53, $54, $55, $56, $57, $58, $59, $60,
          $61, $62, $63, $64, $65, $66, $67, $68, $69, $70,
          $71, $72, $73, $74, $75, $76, $77, $78, $79, $80,
          $81, $82, $83, $84, $85, $86
        ) RETURNING *
      `, [
                employee_id, first_name, middle_name, last_name, preferred_name,
                email, personal_email, phone_number, alternate_phone,
                date_of_birth, gender, marital_status, blood_group, nationality || 'Indian',
                pan_number, encrypted_aadhaar, uan_number, pan_aadhaar_linked, pan_linked_date,
                esi_number, pf_account_number, previous_pf_account, tax_regime || 'new', professional_tax_applicable !== false,
                bank_name, encrypted_bank_account, bank_ifsc_code, bank_branch,
                account_holder_name, account_type || 'savings', payment_method || 'bank_transfer', currency_code || 'INR',
                role_id, department_id, position_id, manager_id, reporting_manager_id,
                hire_date || joining_date, joining_date || hire_date, confirmation_date, probation_period_months || 3, notice_period_days || 30,
                employment_type || 'full_time', employee_category, work_location, contract_start_date, contract_end_date,
                default_shift_id, shift_pattern || 'fixed', work_hours_per_day || 8.00, work_days_per_week || 5,
                overtime_eligible !== false, weekend_days || [0, 6], flexible_hours_allowed || false, remote_work_allowed || false,
                salary, basic_salary, hra, special_allowance, transport_allowance,
                medical_allowance, dearness_allowance, other_allowances ? JSON.stringify(other_allowances) : null,
                pf_contribution, esi_contribution, professional_tax, tds_amount,
                annual_bonus, performance_bonus ? JSON.stringify(performance_bonus) : null, variable_pay_percentage,
                gratuity_applicable || false, leave_policy_id, health_insurance_number,
                health_insurance_provider, health_insurance_expiry,
                passport_number, passport_expiry_date, passport_country,
                driving_license_number, driving_license_expiry, voter_id,
                address ? JSON.stringify(address) : null,
                emergency_contact ? JSON.stringify(emergency_contact) : null,
                education_qualifications ? JSON.stringify(education_qualifications) : null,
                previous_employment ? JSON.stringify(previous_employment) : null,
                preferences ? JSON.stringify(preferences) : null
            ]);

            await client.query('COMMIT');

            logger.info('Employee created', { employee_id, email });

            // Don't return sensitive data
            const employee = result.rows[0];
            employee.password_hash = undefined;
            employee.aadhaar_number = '************';
            employee.bank_account_number = '************';

            res.status(201).json(employee);

        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error creating employee', { error: error.message });
            res.status(500).json({ error: error.message });
        } finally {
            client.release();
        }
    }
);
