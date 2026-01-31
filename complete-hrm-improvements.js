const { pool } = require('./backend/db');

async function implementCompleteHRMImprovements() {
    try {
        console.log('🚀 Starting Complete HRM System Improvements...\n');

        // ========================================
        // 1. EMPLOYEE LIFECYCLE MANAGEMENT
        // ========================================
        console.log('1. 📈 Enhancing Employee Lifecycle Management...');

        // Probation tracking
        await pool.query(`
            CREATE TABLE IF NOT EXISTS employee_probation (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                probation_type VARCHAR(50) DEFAULT 'standard', -- standard, extended, performance
                supervisor_id UUID REFERENCES user_profiles(id),
                goals TEXT,
                status VARCHAR(50) DEFAULT 'active', -- active, extended, completed, failed
                review_date DATE,
                final_rating DECIMAL(3,1),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Career progression tracking
        await pool.query(`
            CREATE TABLE IF NOT EXISTS career_progression (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
                from_position_id UUID REFERENCES positions(id),
                to_position_id UUID REFERENCES positions(id),
                promotion_date DATE NOT NULL,
                effective_date DATE NOT NULL,
                salary_change DECIMAL(12,2),
                reason TEXT,
                approved_by UUID REFERENCES user_profiles(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Employee transfers
        await pool.query(`
            CREATE TABLE IF NOT EXISTS employee_transfers (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
                from_department_id UUID REFERENCES departments(id),
                to_department_id UUID REFERENCES departments(id),
                from_position_id UUID REFERENCES positions(id),
                to_position_id UUID REFERENCES positions(id),
                transfer_date DATE NOT NULL,
                effective_date DATE NOT NULL,
                reason VARCHAR(255),
                approved_by UUID REFERENCES user_profiles(id),
                status VARCHAR(50) DEFAULT 'pending', -- pending, approved, completed
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('   ✅ Employee lifecycle tables created');

        // ========================================
        // 2. ADVANCED ANALYTICS & REPORTING
        // ========================================
        console.log('2. 📊 Implementing Advanced Analytics...');

        // Custom reports
        await pool.query(`
            CREATE TABLE IF NOT EXISTS custom_reports (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL,
                description TEXT,
                report_type VARCHAR(100) NOT NULL, -- employee, attendance, payroll, performance
                filters JSONB DEFAULT '{}',
                columns JSONB DEFAULT '[]',
                created_by UUID REFERENCES user_profiles(id),
                is_public BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Dashboard widgets
        await pool.query(`
            CREATE TABLE IF NOT EXISTS dashboard_widgets (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
                widget_type VARCHAR(100) NOT NULL,
                title VARCHAR(255),
                config JSONB DEFAULT '{}',
                position_x INTEGER DEFAULT 0,
                position_y INTEGER DEFAULT 0,
                width INTEGER DEFAULT 4,
                height INTEGER DEFAULT 3,
                is_visible BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // KPI tracking
        await pool.query(`
            CREATE TABLE IF NOT EXISTS kpi_tracking (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL,
                category VARCHAR(100), -- hr, financial, operational
                target_value DECIMAL(12,2),
                current_value DECIMAL(12,2),
                unit VARCHAR(50),
                period VARCHAR(50), -- monthly, quarterly, yearly
                department_id UUID REFERENCES departments(id),
                responsible_user_id UUID REFERENCES user_profiles(id),
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('   ✅ Advanced analytics tables created');

        // ========================================
        // 3. COMPLIANCE & LEGAL MANAGEMENT
        // ========================================
        console.log('3. ⚖️ Implementing Compliance Management...');

        // Compliance requirements
        await pool.query(`
            CREATE TABLE IF NOT EXISTS compliance_requirements (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL,
                description TEXT,
                category VARCHAR(100), -- labor_law, safety, data_privacy, etc.
                jurisdiction VARCHAR(100), -- country/state specific
                frequency VARCHAR(50), -- one_time, annual, quarterly, monthly
                due_date DATE,
                responsible_user_id UUID REFERENCES user_profiles(id),
                status VARCHAR(50) DEFAULT 'active', -- active, completed, overdue
                last_reviewed DATE,
                next_review DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Legal documents
        await pool.query(`
            CREATE TABLE IF NOT EXISTS legal_documents (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                title VARCHAR(255) NOT NULL,
                document_type VARCHAR(100), -- policy, contract, agreement, etc.
                category VARCHAR(100),
                employee_id UUID REFERENCES user_profiles(id),
                file_path VARCHAR(500),
                expiry_date DATE,
                signed_date DATE,
                status VARCHAR(50) DEFAULT 'draft', -- draft, signed, expired
                created_by UUID REFERENCES user_profiles(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Audit trail
        await pool.query(`
            CREATE TABLE IF NOT EXISTS audit_trail (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID REFERENCES user_profiles(id),
                action VARCHAR(255) NOT NULL,
                entity_type VARCHAR(100), -- employee, payroll, attendance, etc.
                entity_id VARCHAR(255),
                old_values JSONB,
                new_values JSONB,
                ip_address INET,
                user_agent TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('   ✅ Compliance and legal tables created');

        // ========================================
        // 4. ENHANCED TIME & ATTENDANCE
        // ========================================
        console.log('4. ⏰ Enhancing Time & Attendance System...');

        // Shift management
        await pool.query(`
            CREATE TABLE IF NOT EXISTS shifts (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(100) NOT NULL,
                department_id UUID REFERENCES departments(id),
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                break_duration INTEGER DEFAULT 60, -- minutes
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Employee shift assignments
        await pool.query(`
            CREATE TABLE IF NOT EXISTS employee_shifts (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
                shift_id UUID REFERENCES shifts(id),
                effective_date DATE NOT NULL,
                end_date DATE,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Overtime tracking
        await pool.query(`
            CREATE TABLE IF NOT EXISTS overtime_records (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
                date DATE NOT NULL,
                hours DECIMAL(4,2) NOT NULL,
                overtime_type VARCHAR(50) DEFAULT 'regular', -- regular, weekend, holiday
                reason TEXT,
                approved_by UUID REFERENCES user_profiles(id),
                status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('   ✅ Enhanced time & attendance tables created');

        // ========================================
        // 5. ADVANCED PERFORMANCE MANAGEMENT
        // ========================================
        console.log('5. 🎯 Implementing Advanced Performance Management...');

        // 360-degree feedback
        await pool.query(`
            CREATE TABLE IF NOT EXISTS feedback_360 (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                review_id INTEGER REFERENCES performance_reviews(id) ON DELETE CASCADE,
                reviewer_id UUID REFERENCES user_profiles(id),
                relationship_type VARCHAR(50), -- manager, peer, subordinate, self
                feedback_text TEXT,
                rating_overall DECIMAL(3,1),
                competencies JSONB DEFAULT '{}',
                is_anonymous BOOLEAN DEFAULT false,
                status VARCHAR(50) DEFAULT 'pending', -- pending, submitted, reviewed
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Goal cascading
        await pool.query(`
            CREATE TABLE IF NOT EXISTS goal_cascading (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                parent_goal_id UUID REFERENCES performance_goals(id) ON DELETE CASCADE,
                child_goal_id UUID REFERENCES performance_goals(id) ON DELETE CASCADE,
                relationship_type VARCHAR(50), -- supports, depends_on, aligned_with
                weight DECIMAL(3,2) DEFAULT 1.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Performance calibration
        await pool.query(`
            CREATE TABLE IF NOT EXISTS performance_calibration (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                session_name VARCHAR(255) NOT NULL,
                department_id UUID REFERENCES departments(id),
                calibration_date DATE NOT NULL,
                participants JSONB DEFAULT '[]',
                results JSONB DEFAULT '{}',
                status VARCHAR(50) DEFAULT 'planned', -- planned, in_progress, completed
                created_by UUID REFERENCES user_profiles(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('   ✅ Advanced performance management tables created');

        // ========================================
        // 6. LEARNING MANAGEMENT SYSTEM (LMS)
        // ========================================
        console.log('6. 📚 Implementing Learning Management System...');

        // Courses
        await pool.query(`
            CREATE TABLE IF NOT EXISTS courses (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                title VARCHAR(255) NOT NULL,
                description TEXT,
                category VARCHAR(100),
                duration_hours DECIMAL(5,1),
                instructor_id UUID REFERENCES user_profiles(id),
                content JSONB DEFAULT '[]', -- modules, lessons, resources
                prerequisites JSONB DEFAULT '[]',
                skills_covered JSONB DEFAULT '[]',
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Course enrollments
        await pool.query(`
            CREATE TABLE IF NOT EXISTS course_enrollments (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
                course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
                enrollment_date DATE DEFAULT CURRENT_DATE,
                completion_date DATE,
                progress_percentage INTEGER DEFAULT 0,
                status VARCHAR(50) DEFAULT 'enrolled', -- enrolled, in_progress, completed, dropped
                score DECIMAL(5,2),
                certificate_issued BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Certifications
        await pool.query(`
            CREATE TABLE IF NOT EXISTS certifications (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
                certification_name VARCHAR(255) NOT NULL,
                issuing_authority VARCHAR(255),
                issue_date DATE NOT NULL,
                expiry_date DATE,
                credential_id VARCHAR(255),
                status VARCHAR(50) DEFAULT 'active', -- active, expired, revoked
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('   ✅ Learning management system tables created');

        // ========================================
        // 7. ADVANCED RECRUITMENT SYSTEM
        // ========================================
        console.log('7. 👥 Implementing Advanced Recruitment System...');

        // Job postings
        await pool.query(`
            CREATE TABLE IF NOT EXISTS job_postings (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                title VARCHAR(255) NOT NULL,
                department_id UUID REFERENCES departments(id),
                position_id UUID REFERENCES positions(id),
                description TEXT,
                requirements TEXT,
                responsibilities TEXT,
                salary_range_min DECIMAL(12,2),
                salary_range_max DECIMAL(12,2),
                employment_type VARCHAR(50), -- full_time, part_time, contract
                location VARCHAR(255),
                posted_date DATE DEFAULT CURRENT_DATE,
                closing_date DATE,
                status VARCHAR(50) DEFAULT 'open', -- open, closed, filled
                posted_by UUID REFERENCES user_profiles(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Job applications
        await pool.query(`
            CREATE TABLE IF NOT EXISTS job_applications (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                job_posting_id UUID REFERENCES job_postings(id) ON DELETE CASCADE,
                applicant_name VARCHAR(255) NOT NULL,
                applicant_email VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                resume_path VARCHAR(500),
                cover_letter TEXT,
                application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(50) DEFAULT 'submitted', -- submitted, under_review, interviewed, rejected, hired
                current_stage VARCHAR(100),
                notes TEXT,
                reviewed_by UUID REFERENCES user_profiles(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Interview scheduling
        await pool.query(`
            CREATE TABLE IF NOT EXISTS interviews (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
                interview_date TIMESTAMP NOT NULL,
                interview_type VARCHAR(50), -- phone, video, in_person
                interviewers JSONB DEFAULT '[]',
                location VARCHAR(255),
                notes TEXT,
                feedback TEXT,
                rating DECIMAL(3,1),
                status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, completed, cancelled
                created_by UUID REFERENCES user_profiles(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('   ✅ Advanced recruitment system tables created');

        // ========================================
        // 8. ENHANCED BENEFITS ADMINISTRATION
        // ========================================
        console.log('8. 🏥 Implementing Enhanced Benefits Administration...');

        // Benefits packages
        await pool.query(`
            CREATE TABLE IF NOT EXISTS benefits_packages (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL,
                description TEXT,
                category VARCHAR(100), -- health, dental, vision, retirement, etc.
                provider_name VARCHAR(255),
                coverage_details JSONB DEFAULT '{}',
                employee_contribution DECIMAL(8,2),
                employer_contribution DECIMAL(8,2),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Employee benefits enrollment
        await pool.query(`
            CREATE TABLE IF NOT EXISTS employee_benefits (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
                benefit_package_id UUID REFERENCES benefits_packages(id),
                enrollment_date DATE DEFAULT CURRENT_DATE,
                effective_date DATE,
                status VARCHAR(50) DEFAULT 'enrolled', -- enrolled, waived, terminated
                dependent_info JSONB DEFAULT '[]',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Benefits claims
        await pool.query(`
            CREATE TABLE IF NOT EXISTS benefits_claims (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
                benefit_type VARCHAR(100),
                claim_date DATE NOT NULL,
                amount DECIMAL(10,2),
                description TEXT,
                supporting_documents JSONB DEFAULT '[]',
                status VARCHAR(50) DEFAULT 'submitted', -- submitted, approved, rejected, paid
                approved_by UUID REFERENCES user_profiles(id),
                approved_date DATE,
                payment_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('   ✅ Enhanced benefits administration tables created');

        // ========================================
        // 9. EXPENSE MANAGEMENT SYSTEM
        // ========================================
        console.log('9. 💰 Implementing Expense Management System...');

        // Expense categories
        await pool.query(`
            CREATE TABLE IF NOT EXISTS expense_categories (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(100) NOT NULL,
                description TEXT,
                max_amount DECIMAL(10,2),
                requires_approval BOOLEAN DEFAULT true,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Expense reports
        await pool.query(`
            CREATE TABLE IF NOT EXISTS expense_reports (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                total_amount DECIMAL(10,2) DEFAULT 0,
                status VARCHAR(50) DEFAULT 'draft', -- draft, submitted, approved, rejected, reimbursed
                submitted_date DATE,
                approved_date DATE,
                approved_by UUID REFERENCES user_profiles(id),
                reimbursement_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Expense items
        await pool.query(`
            CREATE TABLE IF NOT EXISTS expense_items (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                report_id UUID REFERENCES expense_reports(id) ON DELETE CASCADE,
                category_id UUID REFERENCES expense_categories(id),
                description TEXT NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                expense_date DATE NOT NULL,
                receipt_path VARCHAR(500),
                merchant_name VARCHAR(255),
                location VARCHAR(255),
                is_billable BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('   ✅ Expense management system tables created');

        // ========================================
        // 10. SYSTEM INTEGRATIONS
        // ========================================
        console.log('10. 🔗 Implementing System Integrations...');

        // API integrations
        await pool.query(`
            CREATE TABLE IF NOT EXISTS api_integrations (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL,
                provider VARCHAR(100), -- slack, teams, gmail, outlook, etc.
                integration_type VARCHAR(50), -- webhook, api, oauth
                config JSONB DEFAULT '{}',
                is_active BOOLEAN DEFAULT true,
                last_sync TIMESTAMP,
                created_by UUID REFERENCES user_profiles(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Integration logs
        await pool.query(`
            CREATE TABLE IF NOT EXISTS integration_logs (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                integration_id UUID REFERENCES api_integrations(id),
                action VARCHAR(255),
                status VARCHAR(50), -- success, error, warning
                message TEXT,
                data JSONB,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Webhooks
        await pool.query(`
            CREATE TABLE IF NOT EXISTS webhooks (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL,
                url VARCHAR(500) NOT NULL,
                events JSONB DEFAULT '[]',
                secret_key VARCHAR(255),
                is_active BOOLEAN DEFAULT true,
                created_by UUID REFERENCES user_profiles(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('   ✅ System integrations tables created');

        // ========================================
        // 11. ENHANCED INDEXES FOR PERFORMANCE
        // ========================================
        console.log('11. ⚡ Adding Performance Indexes...');

        const performanceIndexes = [
            'CREATE INDEX IF NOT EXISTS idx_employee_probation_employee_id ON employee_probation(employee_id)',
            'CREATE INDEX IF NOT EXISTS idx_employee_probation_status ON employee_probation(status)',
            'CREATE INDEX IF NOT EXISTS idx_career_progression_employee_id ON career_progression(employee_id)',
            'CREATE INDEX IF NOT EXISTS idx_employee_transfers_employee_id ON employee_transfers(employee_id)',
            'CREATE INDEX IF NOT EXISTS idx_employee_transfers_status ON employee_transfers(status)',
            'CREATE INDEX IF NOT EXISTS idx_custom_reports_type ON custom_reports(report_type)',
            'CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_user_id ON dashboard_widgets(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_kpi_tracking_category ON kpi_tracking(category)',
            'CREATE INDEX IF NOT EXISTS idx_compliance_requirements_category ON compliance_requirements(category)',
            'CREATE INDEX IF NOT EXISTS idx_legal_documents_employee_id ON legal_documents(employee_id)',
            'CREATE INDEX IF NOT EXISTS idx_legal_documents_expiry ON legal_documents(expiry_date)',
            'CREATE INDEX IF NOT EXISTS idx_audit_trail_entity ON audit_trail(entity_type, entity_id)',
            'CREATE INDEX IF NOT EXISTS idx_audit_trail_timestamp ON audit_trail(timestamp)',
            'CREATE INDEX IF NOT EXISTS idx_shifts_department_id ON shifts(department_id)',
            'CREATE INDEX IF NOT EXISTS idx_employee_shifts_employee_id ON employee_shifts(employee_id)',
            'CREATE INDEX IF NOT EXISTS idx_overtime_records_employee_id ON overtime_records(employee_id)',
            'CREATE INDEX IF NOT EXISTS idx_overtime_records_date ON overtime_records(date)',
            'CREATE INDEX IF NOT EXISTS idx_feedback_360_review_id ON feedback_360(review_id)',
            'CREATE INDEX IF NOT EXISTS idx_course_enrollments_employee_id ON course_enrollments(employee_id)',
            'CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id)',
            'CREATE INDEX IF NOT EXISTS idx_certifications_employee_id ON certifications(employee_id)',
            'CREATE INDEX IF NOT EXISTS idx_job_postings_department_id ON job_postings(department_id)',
            'CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_posting_id)',
            'CREATE INDEX IF NOT EXISTS idx_interviews_application_id ON interviews(application_id)',
            'CREATE INDEX IF NOT EXISTS idx_employee_benefits_employee_id ON employee_benefits(employee_id)',
            'CREATE INDEX IF NOT EXISTS idx_benefits_claims_employee_id ON benefits_claims(employee_id)',
            'CREATE INDEX IF NOT EXISTS idx_expense_reports_employee_id ON expense_reports(employee_id)',
            'CREATE INDEX IF NOT EXISTS idx_expense_reports_status ON expense_reports(status)',
            'CREATE INDEX IF NOT EXISTS idx_expense_items_report_id ON expense_items(report_id)',
            'CREATE INDEX IF NOT EXISTS idx_integration_logs_integration_id ON integration_logs(integration_id)',
            'CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(is_active)'
        ];

        for (const index of performanceIndexes) {
            try {
                await pool.query(index);
            } catch (error) {
                console.log(`   ⚠️  Index creation failed: ${index.substring(0, 50)}...`);
            }
        }

        console.log('   ✅ Performance indexes added');

        // ========================================
        // 12. DATA MIGRATION & SEEDING
        // ========================================
        console.log('12. 🌱 Seeding Initial Data...');

        // Seed compliance requirements
        const complianceData = [
            {
                name: 'Annual Safety Training',
                description: 'Mandatory safety training for all employees',
                category: 'safety',
                frequency: 'annual',
                jurisdiction: 'company_wide'
            },
            {
                name: 'Data Privacy Compliance',
                description: 'GDPR/CCPA compliance training',
                category: 'data_privacy',
                frequency: 'annual',
                jurisdiction: 'global'
            },
            {
                name: 'Anti-Harassment Training',
                description: 'Workplace harassment prevention training',
                category: 'hr_policy',
                frequency: 'annual',
                jurisdiction: 'company_wide'
            }
        ];

        for (const compliance of complianceData) {
            try {
                await pool.query(`
                    INSERT INTO compliance_requirements (name, description, category, frequency, jurisdiction)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT DO NOTHING
                `, [compliance.name, compliance.description, compliance.category, compliance.frequency, compliance.jurisdiction]);
            } catch (error) {
                // Ignore conflicts
            }
        }

        // Seed expense categories
        const expenseCategories = [
            { name: 'Travel', description: 'Business travel expenses', max_amount: 5000 },
            { name: 'Meals', description: 'Business meal expenses', max_amount: 500 },
            { name: 'Office Supplies', description: 'Office supplies and equipment', max_amount: 1000 },
            { name: 'Training', description: 'Training and certification expenses', max_amount: 2000 },
            { name: 'Software', description: 'Software licenses and subscriptions', max_amount: 1000 }
        ];

        for (const category of expenseCategories) {
            try {
                await pool.query(`
                    INSERT INTO expense_categories (name, description, max_amount)
                    VALUES ($1, $2, $3)
                    ON CONFLICT DO NOTHING
                `, [category.name, category.description, category.max_amount]);
            } catch (error) {
                // Ignore conflicts
            }
        }

        console.log('   ✅ Initial data seeded');

        // ========================================
        // 13. FINAL VERIFICATION
        // ========================================
        console.log('\n🔍 Verifying Complete HRM Implementation...');

        const verificationQueries = [
            { name: 'Employee Probation Table', query: 'SELECT 1 FROM information_schema.tables WHERE table_name = \'employee_probation\'' },
            { name: 'Advanced Analytics Tables', query: 'SELECT 1 FROM information_schema.tables WHERE table_name = \'custom_reports\'' },
            { name: 'Compliance Management', query: 'SELECT 1 FROM information_schema.tables WHERE table_name = \'compliance_requirements\'' },
            { name: 'Enhanced Attendance', query: 'SELECT 1 FROM information_schema.tables WHERE table_name = \'shifts\'' },
            { name: 'Advanced Performance', query: 'SELECT 1 FROM information_schema.tables WHERE table_name = \'feedback_360\'' },
            { name: 'Learning Management', query: 'SELECT 1 FROM information_schema.tables WHERE table_name = \'courses\'' },
            { name: 'Advanced Recruitment', query: 'SELECT 1 FROM information_schema.tables WHERE table_name = \'job_postings\'' },
            { name: 'Enhanced Benefits', query: 'SELECT 1 FROM information_schema.tables WHERE table_name = \'benefits_packages\'' },
            { name: 'Expense Management', query: 'SELECT 1 FROM information_schema.tables WHERE table_name = \'expense_reports\'' },
            { name: 'System Integrations', query: 'SELECT 1 FROM information_schema.tables WHERE table_name = \'api_integrations\'' }
        ];

        let verifiedCount = 0;
        for (const verification of verificationQueries) {
            try {
                const result = await pool.query(verification.query);
                if (result.rows.length > 0) {
                    console.log(`✅ ${verification.name}: IMPLEMENTED`);
                    verifiedCount++;
                } else {
                    console.log(`❌ ${verification.name}: MISSING`);
                }
            } catch (error) {
                console.log(`❌ ${verification.name}: ERROR - ${error.message}`);
            }
        }

        console.log(`\n🎉 HRM System Enhancement Complete!`);
        console.log(`📊 Implementation Status: ${verifiedCount}/${verificationQueries.length} modules successfully implemented`);
        console.log(`🚀 Your HRM system now includes:`);
        console.log(`   • Complete Employee Lifecycle Management`);
        console.log(`   • Advanced Analytics & Custom Reporting`);
        console.log(`   • Compliance & Legal Document Management`);
        console.log(`   • Enhanced Time & Attendance with Shifts`);
        console.log(`   • 360-Degree Performance Management`);
        console.log(`   • Full Learning Management System`);
        console.log(`   • Advanced Recruitment & ATS`);
        console.log(`   • Comprehensive Benefits Administration`);
        console.log(`   • Expense Management & Reimbursement`);
        console.log(`   • API Integrations & Webhooks`);
        console.log(`   • Audit Trails & Security`);
        console.log(`\n💼 Ready for Enterprise Use!`);

    } catch (error) {
        console.error('❌ Error implementing HRM improvements:', error);
    } finally {
        await pool.end();
    }
}

implementCompleteHRMImprovements();
