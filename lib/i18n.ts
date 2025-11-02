
import React, { createContext, useState, useContext, ReactNode } from 'react';

const translations = {
    en: {
        // General
        loading: 'Loading...',
        errorOccurred: 'An error occurred. Please try again.',
        
        // Header & Footer
        invoiceGenerator: 'Invoice Generator',
        signedInAs: 'Signed in as',
        myInvoices: 'My Invoices',
        signOut: 'Sign out',
        author: 'Author: HoangPham',
        
        // Auth
        signInTitle: 'Sign in to your account',
        createAccountTitle: 'Create a new account',
        resetPasswordTitle: 'Reset your password',
        authDesc: 'To access the Invoice Generator',
        resetPasswordDesc: 'Enter your email to receive a reset link',
        emailAddress: 'Email address',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        processing: 'Processing...',
        sendResetLink: 'Send Reset Link',
        signUp: 'Sign Up',
        signIn: 'Sign In',
        forgotPassword: 'Forgot your password?',
        backToSignIn: 'Back to Sign In',
        alreadyHaveAccount: 'Already have an account? Sign In',
        dontHaveAccount: "Don't have an account? Sign Up",
        checkEmailReset: 'Check your email for the password reset link!',
        emailNotRegistered: 'Email is not registered.',
        passwordsDoNotMatch: "Passwords do not match.",
        emailAlreadyRegistered: "Email is already registered.",
        checkEmailConfirm: 'Check your email for the confirmation link!',

        // Update Password
        updatePasswordTitle: 'Update your password',
        updatePasswordDesc: 'Enter a new password for your account.',
        newPassword: 'New Password',
        confirmNewPassword: 'Confirm New Password',
        passwordLengthError: "Password should be at least 6 characters.",
        passwordUpdateSuccess: 'Your password has been updated successfully!',
        updating: 'Updating...',
        updatePasswordButton: 'Update Password',

        // Invoice List Page
        newInvoice: 'New Invoice',
        createNewInvoiceAria: 'Create new invoice',
        databaseSetupError: 'Database not set up. Please run the SQL script provided in InvoiceForm.tsx.',
        fetchInvoicesError: 'Could not fetch invoices.',
        deleteInvoiceError: 'Failed to delete invoice.',
        deleteInvoiceSuccess: 'Invoice deleted.',
        loadingInvoices: 'Loading invoices...',

        // Invoice List Component
        noSavedInvoices: 'No saved invoices yet.',
        invoiceListNumber: 'Invoice #',
        invoiceListClient: 'Client',
        invoiceListDueDate: 'Due Date',
        invoiceListAmount: 'Amount',
        invoiceListActions: 'Actions',
        editInvoiceAria: 'Edit invoice {{invoiceNumber}}',
        deleteInvoiceAria: 'Delete invoice {{invoiceNumber}}',
        deleteConfirm: 'Are you sure you want to delete invoice {{invoiceNumber}}?',
        deleteInvoiceTitle: 'Delete Invoice?',
        cancel: 'Cancel',
        delete: 'Delete',
        
        // Invoice Form
        editingInvoice: 'Editing: {{invoiceNumber}}',
        backToList: 'Back to List',
        saving: 'Saving...',
        updateInvoice: 'Update Invoice',
        saveInvoice: 'Save Invoice',
        from: 'From',
        name: 'Name',
        address: 'Address',
        email: 'Email',
        logo: 'Logo',
        uploadLogo: 'Upload Logo',
        removeLogo: 'Remove',
        logoSizeError: 'Logo file size should be less than 2MB.',
        logoSize: 'Logo Size',
        to: 'To',
        invoiceNumber: 'Invoice Number',
        date: 'Date',
        dueDate: 'Due Date',
        items: 'Items',
        description: 'Description',
        quantityShort: 'Qty',
        price: 'Price',
        addItem: 'Add Item',
        notes: 'Notes',
        taxRate: 'Tax Rate (%)',
        currency: 'Currency',
        invoiceTitle: 'INVOICE',
        billTo: 'BILL TO',
        item: 'Item',
        total: 'Total',
        subtotal: 'Subtotal',
        tax: 'Tax',
        generating: 'Generating...',
        downloadPdf: 'Download PDF',
        mustBeLoggedInToSave: 'You must be logged in to save.',
        failedToSaveInvoice: 'Failed to save invoice. Please try again.',
        invoiceSavedSuccess: 'Invoice {{invoiceNumber}} saved!',
        pdfLibraryNotFound: 'PDF generation library not found.',
        pdfGenerationError: 'An error occurred while generating the PDF.',
    },
    vi: {
        loading: 'Đang tải...',
        errorOccurred: 'Đã xảy ra lỗi. Vui lòng thử lại.',
        invoiceGenerator: 'Tạo hoá đơn',
        signedInAs: 'Đăng nhập với tư cách',
        myInvoices: 'Hoá đơn của tôi',
        signOut: 'Đăng xuất',
        author: 'Tác giả: HoàngPhạm',
        signInTitle: 'Đăng nhập vào tài khoản',
        createAccountTitle: 'Tạo tài khoản mới',
        resetPasswordTitle: 'Đặt lại mật khẩu',
        authDesc: 'Để truy cập Trình tạo hoá đơn',
        resetPasswordDesc: 'Nhập email để nhận liên kết đặt lại',
        emailAddress: 'Địa chỉ email',
        password: 'Mật khẩu',
        confirmPassword: 'Xác nhận mật khẩu',
        processing: 'Đang xử lý...',
        sendResetLink: 'Gửi liên kết',
        signUp: 'Đăng ký',
        signIn: 'Đăng nhập',
        forgotPassword: 'Quên mật khẩu?',
        backToSignIn: 'Quay lại Đăng nhập',
        alreadyHaveAccount: 'Đã có tài khoản? Đăng nhập',
        dontHaveAccount: 'Chưa có tài khoản? Đăng ký',
        checkEmailReset: 'Kiểm tra email của bạn để lấy liên kết đặt lại mật khẩu!',
        emailNotRegistered: 'Email chưa được đăng ký.',
        passwordsDoNotMatch: "Mật khẩu không khớp.",
        emailAlreadyRegistered: "Email đã được đăng ký.",
        checkEmailConfirm: 'Kiểm tra email của bạn để lấy liên kết xác nhận!',
        updatePasswordTitle: 'Cập nhật mật khẩu',
        updatePasswordDesc: 'Nhập mật khẩu mới cho tài khoản của bạn.',
        newPassword: 'Mật khẩu mới',
        confirmNewPassword: 'Xác nhận mật khẩu mới',
        passwordLengthError: "Mật khẩu phải có ít nhất 6 ký tự.",
        passwordUpdateSuccess: 'Mật khẩu của bạn đã được cập nhật thành công!',
        updating: 'Đang cập nhật...',
        updatePasswordButton: 'Cập nhật mật khẩu',
        newInvoice: 'Hoá đơn mới',
        createNewInvoiceAria: 'Tạo hoá đơn mới',
        databaseSetupError: 'Cơ sở dữ liệu chưa được thiết lập. Vui lòng chạy tập lệnh SQL được cung cấp trong InvoiceForm.tsx.',
        fetchInvoicesError: 'Không thể tải hoá đơn.',
        deleteInvoiceError: 'Xóa hoá đơn thất bại.',
        deleteInvoiceSuccess: 'Đã xóa hoá đơn.',
        loadingInvoices: 'Đang tải hoá đơn...',
        noSavedInvoices: 'Chưa có hoá đơn nào được lưu.',
        invoiceListNumber: 'Số HĐ',
        invoiceListClient: 'Khách hàng',
        invoiceListDueDate: 'Ngày hết hạn',
        invoiceListAmount: 'Số tiền',
        invoiceListActions: 'Hành động',
        editInvoiceAria: 'Chỉnh sửa hoá đơn {{invoiceNumber}}',
        deleteInvoiceAria: 'Xóa hoá đơn {{invoiceNumber}}',
        deleteConfirm: 'Bạn có chắc muốn xóa hoá đơn {{invoiceNumber}} không?',
        deleteInvoiceTitle: 'Xóa hóa đơn?',
        cancel: 'Hủy',
        delete: 'Xóa',
        editingInvoice: 'Đang sửa: {{invoiceNumber}}',
        backToList: 'Quay lại danh sách',
        saving: 'Đang lưu...',
        updateInvoice: 'Cập nhật hoá đơn',
        saveInvoice: 'Lưu hoá đơn',
        from: 'Từ',
        name: 'Tên',
        address: 'Địa chỉ',
        email: 'Email',
        logo: 'Logo',
        uploadLogo: 'Tải logo lên',
        removeLogo: 'Xóa',
        logoSizeError: 'Kích thước tệp logo phải nhỏ hơn 2MB.',
        logoSize: 'Kích thước Logo',
        to: 'Đến',
        invoiceNumber: 'Số hoá đơn',
        date: 'Ngày',
        dueDate: 'Ngày hết hạn',
        items: 'Các mục',
        description: 'Mô tả',
        quantityShort: 'SL',
        price: 'Giá',
        addItem: 'Thêm mục',
        notes: 'Ghi chú',
        taxRate: 'Thuế suất (%)',
        currency: 'Tiền tệ',
        invoiceTitle: 'HOÁ ĐƠN',
        billTo: 'THANH TOÁN CHO',
        item: 'Mục',
        total: 'Tổng cộng',
        subtotal: 'Tổng phụ',
        tax: 'Thuế',
        generating: 'Đang tạo...',
        downloadPdf: 'Tải PDF',
        mustBeLoggedInToSave: 'Bạn phải đăng nhập để lưu.',
        failedToSaveInvoice: 'Lưu hoá đơn thất bại. Vui lòng thử lại.',
        invoiceSavedSuccess: 'Đã lưu hoá đơn {{invoiceNumber}}!',
        pdfLibraryNotFound: 'Không tìm thấy thư viện tạo PDF.',
        pdfGenerationError: 'Đã xảy ra lỗi khi tạo PDF.',
    },
    nl: {
        loading: 'Laden...',
        errorOccurred: 'Er is een fout opgetreden. Probeer het opnieuw.',
        invoiceGenerator: 'Factuur Generator',
        signedInAs: 'Aangemeld als',
        myInvoices: 'Mijn Facturen',
        signOut: 'Afmelden',
        author: 'Auteur: HoangPham',
        signInTitle: 'Meld u aan bij uw account',
        createAccountTitle: 'Maak een nieuw account',
        resetPasswordTitle: 'Reset uw wachtwoord',
        authDesc: 'Om toegang te krijgen tot de Factuur Generator',
        resetPasswordDesc: 'Voer uw e-mailadres in om een resetlink te ontvangen',
        emailAddress: 'E-mailadres',
        password: 'Wachtwoord',
        confirmPassword: 'Bevestig Wachtwoord',
        processing: 'Verwerken...',
        sendResetLink: 'Verstuur Resetlink',
        signUp: 'Registreren',
        signIn: 'Aanmelden',
        forgotPassword: 'Wachtwoord vergeten?',
        backToSignIn: 'Terug naar Aanmelden',
        alreadyHaveAccount: 'Heeft u al een account? Aanmelden',
        dontHaveAccount: 'Geen account? Registreren',
        checkEmailReset: 'Controleer uw e-mail voor de wachtwoord resetlink!',
        emailNotRegistered: 'E-mail is niet geregistreerd.',
        passwordsDoNotMatch: "Wachtwoorden komen niet overeen.",
        emailAlreadyRegistered: "E-mail is al geregistreerd.",
        checkEmailConfirm: 'Controleer uw e-mail voor de bevestigingslink!',
        updatePasswordTitle: 'Update uw wachtwoord',
        updatePasswordDesc: 'Voer een nieuw wachtwoord in voor uw account.',
        newPassword: 'Nieuw Wachtwoord',
        confirmNewPassword: 'Bevestig Nieuw Wachtwoord',
        passwordLengthError: "Wachtwoord moet minimaal 6 tekens lang zijn.",
        passwordUpdateSuccess: 'Uw wachtwoord is succesvol bijgewerkt!',
        updating: 'Bijwerken...',
        updatePasswordButton: 'Wachtwoord Updaten',
        newInvoice: 'Nieuwe Factuur',
        createNewInvoiceAria: 'Maak nieuwe factuur',
        databaseSetupError: 'Database niet ingesteld. Voer het SQL-script uit dat in InvoiceForm.tsx wordt geleverd.',
        fetchInvoicesError: 'Kon facturen niet ophalen.',
        deleteInvoiceError: 'Factuur verwijderen mislukt.',
        deleteInvoiceSuccess: 'Factuur verwijderd.',
        loadingInvoices: 'Facturen laden...',
        noSavedInvoices: 'Nog geen opgeslagen facturen.',
        invoiceListNumber: 'Factuur #',
        invoiceListClient: 'Klant',
        invoiceListDueDate: 'Vervaldatum',
        invoiceListAmount: 'Bedrag',
        invoiceListActions: 'Acties',
        editInvoiceAria: 'Bewerk factuur {{invoiceNumber}}',
        deleteInvoiceAria: 'Verwijder factuur {{invoiceNumber}}',
        deleteConfirm: 'Weet u zeker dat u factuur {{invoiceNumber}} wilt verwijderen?',
        deleteInvoiceTitle: 'Factuur verwijderen?',
        cancel: 'Annuleren',
        delete: 'Verwijderen',
        editingInvoice: 'Bewerken: {{invoiceNumber}}',
        backToList: 'Terug naar lijst',
        saving: 'Opslaan...',
        updateInvoice: 'Factuur Bijwerken',
        saveInvoice: 'Factuur Opslaan',
        from: 'Van',
        name: 'Naam',
        address: 'Adres',
        email: 'E-mail',
        logo: 'Logo',
        uploadLogo: 'Upload Logo',
        removeLogo: 'Verwijder',
        logoSizeError: 'Logo bestandsgrootte moet minder dan 2MB zijn.',
        logoSize: 'Logo Grootte',
        to: 'Aan',
        invoiceNumber: 'Factuurnummer',
        date: 'Datum',
        dueDate: 'Vervaldatum',
        items: 'Items',
        description: 'Beschrijving',
        quantityShort: 'Aant',
        price: 'Prijs',
        addItem: 'Item Toevoegen',
        notes: 'Notities',
        taxRate: 'Btw-tarief (%)',
        currency: 'Valuta',
        invoiceTitle: 'FACTUUR',
        billTo: 'FACTUUR AAN',
        item: 'Item',
        total: 'Totaal',
        subtotal: 'Subtotaal',
        tax: 'Btw',
        generating: 'Genereren...',
        downloadPdf: 'Download PDF',
        mustBeLoggedInToSave: 'U moet ingelogd zijn om op te slaan.',
        failedToSaveInvoice: 'Opslaan van factuur mislukt. Probeer het opnieuw.',
        invoiceSavedSuccess: 'Factuur {{invoiceNumber}} opgeslagen!',
        pdfLibraryNotFound: 'PDF-generatiebibliotheek niet gevonden.',
        pdfGenerationError: 'Er is een fout opgetreden bij het genereren van de PDF.',
    },
};

type Language = 'en' | 'vi' | 'nl';

interface LanguageContextType {
    language: Language;
    setLanguage: (language: Language) => void;
    t: (key: string, options?: { [key: string]: string | number }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>(() => {
        const browserLang = navigator.language.split('-')[0];
        const savedLang = localStorage.getItem('language');
        if (savedLang && ['en', 'vi', 'nl'].includes(savedLang)) {
            return savedLang as Language;
        }
        if (['vi', 'nl'].includes(browserLang)) {
            return browserLang as Language;
        }
        return 'en';
    });

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem('language', lang);
    }

    const t = (key: string, options?: { [key: string]: string | number }): string => {
        let translation = translations[language][key as keyof typeof translations.en] || translations.en[key as keyof typeof translations.en];
        if (options) {
            Object.keys(options).forEach(k => {
                if (translation) {
                    translation = translation.replace(`{{${k}}}`, String(options[k]));
                }
            });
        }
        return translation || key;
    };

    // FIX: Replaced JSX with React.createElement to support usage in a .ts file.
    // The original JSX syntax was causing parsing errors because this is not a .tsx file.
    return React.createElement(LanguageContext.Provider, { value: { language, setLanguage: handleSetLanguage, t } }, children);
};

export const useTranslation = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useTranslation must be used within a LanguageProvider');
    }
    return context;
};