'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import LoadingScreen from '@/components/LoadingScreen';
import Select from 'react-select';
import { FaInfoCircle, FaTimes, FaUpload, FaCheckCircle, FaArrowLeft, FaArrowRight, FaExclamationTriangle } from 'react-icons/fa';
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '900'],
  variable: '--font-poppins',
});

// --- CONSTANTES ---
const opcionesTrabajadores = ['0', 'De 1 a 10', 'De 11 a 20', 'De 21 a 50', 'Más de 50'].map(e => ({ value: e, label: e }));
const opcionesMesas = ['0', 'De 1 a 5', 'De 5 a 20', 'De 21 a 50', 'Más de 50'].map(e => ({ value: e, label: e }));
const opcionesTenencia = [
  { value: 'Propio', label: 'Propio' },
  { value: 'Arrendado', label: 'Arrendado' }
];

// --- UTILS ---
const toBase64 = (file: File) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result?.toString().split(',')[1]);
  reader.onerror = error => reject(error);
});

const processFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.type.startsWith('image/')) {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 1024;
        const scaleSize = maxWidth / img.width;
        const width = (img.width > maxWidth) ? maxWidth : img.width;
        const height = (img.width > maxWidth) ? img.height * scaleSize : img.height;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl.split(',')[1]);
      };
      img.onerror = error => reject(error);
    } else {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result?.toString().split(',')[1] || "");
      reader.onerror = error => reject(error);
    }
  });
};

// --- ESTILOS SELECT ---
const customSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderRadius: "10px",
    borderColor: state.selectProps.hasError ? "#dc3545" : (state.isFocused ? "#4cb700" : "#ccc"),
    backgroundColor: "white",
    padding: "0 2px",
    boxShadow: "none",
    "&:hover": { borderColor: state.selectProps.hasError ? "#dc3545" : "#4cb700" },
    minHeight: "42px",
    height: "42px",
    fontSize: "13px",
    fontFamily: 'var(--font-poppins), sans-serif'
  }),
  placeholder: (base: any) => ({ ...base, color: "#747474", fontWeight: "500", paddingLeft: "8px" }),
  menu: (base: any) => ({ ...base, borderRadius: "10px", zIndex: 9999, marginTop: "2px", fontFamily: 'var(--font-poppins), sans-serif' }),
  option: (base: any, state: any) => ({ ...base, backgroundColor: state.isSelected ? "#4cb700" : state.isFocused ? "#e6f2e8" : "white", color: state.isSelected ? "white" : "#333", cursor: "pointer", fontSize: "13px", padding: "10px 15px" }),
  singleValue: (base: any) => ({ ...base, backgroundColor: "#dcedc8", borderRadius: "6px", padding: "2px 8px", color: "#2e6b00", fontSize: "13px", fontWeight: "600", margin: "2px", display: "inline-flex", alignItems: "center" }),
  valueContainer: (base: any) => ({ ...base, padding: "0 4px", display: "flex", alignItems: "center" })
};

const prefixStyles = {
  ...customSelectStyles,
  control: (base: any) => ({
    ...base, border: 'none', boxShadow: 'none', backgroundColor: 'transparent', minHeight: '40px', width: '80px', cursor: 'pointer'
  }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (base: any) => ({ ...base, padding: 4, color: "#4CB700" }),
  input: (base: any) => ({ ...base, margin: 0, padding: 0 })
};

export default function ActivacionUsuario() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<any>({});

  // Modal Error
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorList, setErrorList] = useState<string[]>([]);

  // Variable de entorno para la API
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

  // --- DATOS API ---
  const [docTypes, setDocTypes] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [fiscalMunis, setFiscalMunis] = useState<any[]>([]);
  const [fiscalParishes, setFiscalParishes] = useState<any[]>([]);
  const [serviceMunis, setServiceMunis] = useState<any[]>([]);
  const [serviceParishes, setServiceParishes] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name_person: '', last_name_person: '', tax_id_number_person: '', phone: '', mobile: '', email: '',
    tax_id_number: '', legal_name: '', commercial_name: '', fiscal_address: '', service_location: '',
    document_date: '', business_opening_date: '', cnae_description: '',
    area_size_full: '', area_size_util: '',
    electricity_contract: ''
  });

  const [prefijoCedula, setPrefijoCedula] = useState<any>(null);
  const [prefijoRif, setPrefijoRif] = useState<any>(null);
  const [workersCount, setWorkersCount] = useState<any>(null);
  const [tablesCount, setTablesCount] = useState<any>(null);
  const [tenenciaSelect, setTenenciaSelect] = useState<any>(null);

  const [fiscalState, setFiscalState] = useState<any>(null);
  const [fiscalMuni, setFiscalMuni] = useState<any>(null);
  const [fiscalParish, setFiscalParish] = useState<any>(null);

  const [serviceState, setServiceState] = useState<any>(null);
  const [serviceMuni, setServiceMuni] = useState<any>(null);
  const [serviceParish, setServiceParish] = useState<any>(null);

  const [fileRif, setFileRif] = useState<File | null>(null);
  const [fileContrato, setFileContrato] = useState<File | null>(null);

  // CARGA INICIAL
  useEffect(() => {
    setIsLoaded(true);
    document.body.classList.add('activacion-loaded');

    fetch(`/api/maestros?type=states`)
      .then(r => r.ok ? r.json() : [])
      .then(d => { if (Array.isArray(d)) setStates(d.map((x: any) => ({ value: x.id, label: x.name }))) })
      .catch(console.error);

    fetch(`/api/maestros?type=doc_types`)
      .then(r => r.ok ? r.json() : [])
      .then(d => {
        if (Array.isArray(d)) {
          const mapped = d.map((x: any) => ({ value: x.id, label: x.id }));
          setDocTypes(mapped);
          setPrefijoCedula(mapped.find((x: any) => x.value === 'V'));
          setPrefijoRif(mapped.find((x: any) => x.value === 'J'));
        }
      })
      .catch(console.error);

    // --- PROTOCOLO RECUPERACIÓN MAL INTERNET ---
    const backup = sessionStorage.getItem('backup_error_envio');
    if (backup) {
      try {
        const { timestamp, data } = JSON.parse(backup);
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          const confirmar = window.confirm("Detectamos que hubo un problema de conexión en su último intento. ¿Desea recuperar la información?");
          if (confirmar) {
            if (data.formData) setFormData(data.formData);
            if (data.prefijoCedula) setPrefijoCedula(data.prefijoCedula);
            if (data.prefijoRif) setPrefijoRif(data.prefijoRif);
            if (data.workersCount) setWorkersCount(data.workersCount);
            if (data.tablesCount) setTablesCount(data.tablesCount);
            if (data.tenenciaSelect) setTenenciaSelect(data.tenenciaSelect);

            if (data.fiscalState) setFiscalState(data.fiscalState);
            if (data.fiscalMuni) setFiscalMuni(data.fiscalMuni);
            if (data.fiscalParish) setFiscalParish(data.fiscalParish);

            if (data.serviceState) setServiceState(data.serviceState);
            if (data.serviceMuni) setServiceMuni(data.serviceMuni);
            if (data.serviceParish) setServiceParish(data.serviceParish);
          } else {
            sessionStorage.removeItem('backup_error_envio');
          }
        } else {
          sessionStorage.removeItem('backup_error_envio');
        }
      } catch (e) { console.error(e); }
    }
  }, []);

  // HANDLERS
  const handleFiscalState = (opt: any) => {
    setFiscalState(opt); setFiscalMuni(null); setFiscalParish(null); setFiscalMunis([]);
    if (opt) {
      fetch(`/api/maestros?type=municipalities&parent_id=${opt.value}`).then(r => r.ok ? r.json() : []).then(d => setFiscalMunis(d.map((x: any) => ({ value: x.id, label: x.name }))));
      setErrors((prev: any) => ({ ...prev, fiscalState: null }));
    }
  };
  const handleFiscalMuni = (opt: any) => {
    setFiscalMuni(opt); setFiscalParish(null); setFiscalParishes([]);
    if (opt) {
      fetch(`/api/maestros?type=parishes&parent_id=${opt.value}`).then(r => r.ok ? r.json() : []).then(d => setFiscalParishes(d.map((x: any) => ({ value: x.id, label: x.name }))));
      setErrors((prev: any) => ({ ...prev, fiscalMuni: null }));
    }
  };
  const handleFiscalParish = (opt: any) => { setFiscalParish(opt); setErrors((prev: any) => ({ ...prev, fiscalParish: null })); };

  const handleServiceState = (opt: any) => {
    setServiceState(opt); setServiceMuni(null); setServiceParish(null); setServiceMunis([]);
    if (opt) {
      fetch(`/api/maestros?type=municipalities&parent_id=${opt.value}`).then(r => r.ok ? r.json() : []).then(d => setServiceMunis(d.map((x: any) => ({ value: x.id, label: x.name }))));
      setErrors((prev: any) => ({ ...prev, serviceState: null }));
    }
  };
  const handleServiceMuni = (opt: any) => {
    setServiceMuni(opt); setServiceParish(null); setServiceParishes([]);
    if (opt) {
      fetch(`/api/maestros?type=parishes&parent_id=${opt.value}`).then(r => r.ok ? r.json() : []).then(d => setServiceParishes(d.map((x: any) => ({ value: x.id, label: x.name }))));
      setErrors((prev: any) => ({ ...prev, serviceMuni: null }));
    }
  };
  const handleServiceParish = (opt: any) => { setServiceParish(opt); setErrors((prev: any) => ({ ...prev, serviceParish: null })); };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: null });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'rif' | 'contrato') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        alert("Error: Solo se permiten archivos en formato PDF.");
        e.target.value = '';
        return;
      }
      const maxBytes = 5 * 1024 * 1024;
      if (file.size > maxBytes) {
        alert("El archivo pesa más de 5MB. Por favor comprímalo antes de subirlo.");
        e.target.value = '';
        return;
      }
      if (type === 'rif') { setFileRif(file); setErrors({ ...errors, fileRif: null }); }
      else { setFileContrato(file); setErrors({ ...errors, fileContrato: null }); }
    }
  };

  const validateStep = () => {
    let newErrors: any = {};
    let missingFields: string[] = [];

    if (currentStep === 1) {
      if (!formData.name_person) { newErrors.name_person = true; missingFields.push("Nombre"); }
      if (!formData.last_name_person) { newErrors.last_name_person = true; missingFields.push("Apellido"); }
      if (!formData.tax_id_number_person) { newErrors.tax_id_number_person = true; missingFields.push("Cédula"); }
      if (!formData.mobile) { newErrors.mobile = true; missingFields.push("Celular"); }
      if (!formData.phone) { newErrors.phone = true; missingFields.push("Teléfono local"); }
      if (!formData.email) { newErrors.email = true; missingFields.push("Correo"); }
    }

    if (currentStep === 2) {
      if (!formData.tax_id_number) { newErrors.tax_id_number = true; missingFields.push("RIF"); }
      if (!formData.legal_name) { newErrors.legal_name = true; missingFields.push("Razón Social"); }
      if (!formData.commercial_name) { newErrors.commercial_name = true; missingFields.push("Nombre Comercial"); }
      if (!fiscalState) { newErrors.fiscalState = true; missingFields.push("Estado Fiscal"); }
      if (!fiscalMuni) { newErrors.fiscalMuni = true; missingFields.push("Municipio Fiscal"); }
      if (!fiscalParish) { newErrors.fiscalParish = true; missingFields.push("Parroquia Fiscal"); }
      if (!formData.fiscal_address) { newErrors.fiscal_address = true; missingFields.push("Dirección Fiscal"); }
      if (!serviceState) { newErrors.serviceState = true; missingFields.push("Estado Comercial"); }
      if (!serviceMuni) { newErrors.serviceMuni = true; missingFields.push("Municipio Comercial"); }
      if (!serviceParish) { newErrors.serviceParish = true; missingFields.push("Parroquia Comercial"); }
      if (!formData.service_location) { newErrors.service_location = true; missingFields.push("Ubicación Comercial"); }
      if (!tenenciaSelect) { newErrors.tenenciaSelect = true; missingFields.push("Tenencia"); }
      if (!formData.electricity_contract) { newErrors.electricity_contract = true; missingFields.push("Cuenta CORPOELEC"); }
      if (!workersCount) { newErrors.workersCount = true; missingFields.push("Cant. Trabajadores"); }
      if (!tablesCount) { newErrors.tablesCount = true; missingFields.push("Cant. Mesas"); }
      if (!formData.business_opening_date) { newErrors.business_opening_date = true; missingFields.push("Fecha inicio operaciones"); }
      if (!formData.document_date) { newErrors.document_date = true; missingFields.push("Fecha registro"); }
    }

    if (currentStep === 3) {
      if (!formData.area_size_full) { newErrors.area_size_full = true; missingFields.push("Área Total"); }
      if (!formData.area_size_util) { newErrors.area_size_util = true; missingFields.push("Área Útil"); }
      if (!formData.cnae_description) { newErrors.cnae_description = true; missingFields.push("Actividad Económica"); }
    }

    if (missingFields.length > 0) {
      setErrors(newErrors);
      setErrorList(missingFields);
      setShowErrorModal(true);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleNext = () => { if (validateStep()) { setCurrentStep(p => p + 1); window.scrollTo(0, 0); } };
  const handleBack = () => { setCurrentStep(p => p - 1); window.scrollTo(0, 0); };

  const handleSubmit = async () => {
    let newErrors: any = {};
    let missingFields: string[] = [];
    if (!fileRif) { newErrors.fileRif = true; missingFields.push("RIF Digital"); }
    if (!fileContrato) { newErrors.fileContrato = true; missingFields.push("Contrato/Documento"); }
    if (missingFields.length > 0) { setErrors(newErrors); setErrorList(missingFields); setShowErrorModal(true); return; }

    setLoading(true);
    try {
      const rifBase64 = await processFile(fileRif!);
      const contratoBase64 = fileContrato ? await processFile(fileContrato) : "";
      const workersInt = workersCount ? parseInt(workersCount.value.replace(/\D/g, '') || '0') : 0;
      const tablesInt = tablesCount ? parseInt(tablesCount.value.replace(/\D/g, '') || '0') : 0;

      const payload = {
        ...formData,
        tax_id_document_type_person: prefijoCedula?.value,
        tax_id_document_type: prefijoRif?.value,
        fiscal_state_id: fiscalState?.value,
        fiscal_municipality_id: fiscalMuni?.value,
        fiscal_parish_id: fiscalParish?.value,
        service_state_id: serviceState?.value,
        service_municipality_id: serviceMuni?.value,
        service_parish_id: serviceParish?.value,
        workers_count: workersInt,
        tables_count: tablesInt,
        area_size_full: parseFloat(formData.area_size_full) || 0.0,
        area_size_util: parseFloat(formData.area_size_util) || 0.0,
        tenancy_type: tenenciaSelect?.value,
        tax_id_photo: rifBase64,
        rental_contract_photo: contratoBase64,
      };

      const res = await fetch(`/api/crear-solicitud`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const result = res.ok ? await res.json() : { success: false };
      if (result.success) { sessionStorage.removeItem('backup_error_envio'); setIsSuccess(true); } 
      else { alert('Error al enviar la solicitud. Por favor verifique los datos e intente nuevamente.'); }
    } catch (error) {
      const dataToSave = { formData, prefijoCedula, prefijoRif, workersCount, tablesCount, tenenciaSelect, fiscalState, fiscalMuni, fiscalParish, serviceState, serviceMuni, serviceParish };
      sessionStorage.setItem('backup_error_envio', JSON.stringify({ timestamp: Date.now(), data: dataToSave }));
      alert('Error de conexión. Se guardó un respaldo temporal en esta sesión del navegador.');
    } finally { setLoading(false); }
  };

  if (isSuccess) {
    return (
      <div className={`success-overlay ${poppins.variable}`}>
        <div className="ios-modal">
          <div className="checkmark-container"><FaCheckCircle className="checkmark-icon" /></div>
          <h2>¡Solicitud Enviada!</h2>
          <p className="success-text">Hemos recibido tu información correctamente. Recibirás respuesta en 48 horas.</p>
          <button className="ios-btn-black" onClick={() => window.location.href = 'https://fospuca-internacional-odoo.odoo.com/inico'}>Finalizar</button>
        </div>
        <style jsx>{`
            .success-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); display: flex; justify-content: center; align-items: center; z-index: 9999; font-family: var(--font-poppins); }
            .ios-modal { background: white; padding: 40px 30px; border-radius: 35px; width: 90%; max-width: 400px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
            :global(.checkmark-icon) { color: #4CB700; font-size: 70px; margin-bottom: 20px; }
            h2 { margin: 0 0 10px 0; font-weight: 800; color: #111; }
            .success-text { color: #666; font-size: 14px; margin-bottom: 30px; line-height: 1.5; }
            .ios-btn-black { background: #1c1c1e; color: white; width: 100%; padding: 16px; border-radius: 18px; border: none; font-weight: 700; font-size: 16px; cursor: pointer; transition: transform 0.1s; }
            .ios-btn-black:active { transform: scale(0.98); }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`activacion-page activacion--light loaded ${poppins.variable}`}>
      {loading && <LoadingScreen />}
      
      {showErrorModal && (
        <div className="modal-overlay" onClick={() => setShowErrorModal(false)}>
          <div className="ios-modal-content" onClick={e => e.stopPropagation()}>
            <div className="ios-modal-header">
              <h3>Atención</h3>
              <button className="ios-close-btn" onClick={() => setShowErrorModal(false)}><FaTimes /></button>
            </div>
            <div className="ios-modal-body">
              <p className="ios-modal-subtitle">Por favor complete los campos obligatorios:</p>
              <div className="ios-list-container">
                {errorList.map((err, i) => (
                  <div key={i} className="ios-list-item">
                    <FaExclamationTriangle className="ios-icon-warn" />
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            </div>
            <button className="ios-btn-black" onClick={() => setShowErrorModal(false)}>Entendido</button>
          </div>
        </div>
      )}

      {showAreaModal && (
        <div className="modal-overlay" onClick={() => setShowAreaModal(false)}>
          <div className="ios-modal-content" onClick={e => e.stopPropagation()}>
            <div className="ios-modal-header">
              <h3>¿Cómo medir las áreas?</h3>
              <button className="ios-close-btn" onClick={() => setShowAreaModal(false)}><FaTimes /></button>
            </div>
            <div className="ios-modal-body">
              <p className="ios-info-text">El Área Útil se refiere solo a los espacios operativos usados para su negocio. El Área Total incluye la superficie completa.</p>
              <div className="ios-info-card"><h4>Área Útil (m²)</h4><p>Espacios donde realmente trabaja (piso de venta, oficina, etc).</p></div>
              <div className="ios-info-card"><h4>Área Total (m²)</h4><p>Superficie completa del inmueble.</p></div>
            </div>
            <button className="ios-btn-black" onClick={() => setShowAreaModal(false)}>Cerrar guía</button>
          </div>
        </div>
      )}

      <div className="form-container">
        <div className="main-content-box">
          <div className="hero-banner">
            <div className="hero-overlay"><div className="hero-text"><h1>¡Registra tu empresa!</h1><p>Complete el formulario.</p></div></div>
          </div>
          <div className="step-indicator">Paso {currentStep} de 4<div className="progress-bar"><div className="progress-fill" style={{ width: `${currentStep * 25}%` }}></div></div></div>
          
          <form className="activacion-form" onSubmit={(e) => e.preventDefault()}>
            {currentStep === 1 && (
              <div className="step-content">
                <div className="section-bar">Datos de contacto</div>
                <div className="form-grid three-cols">
                  <div className="input-group"><div className={`input-pill ${errors.name_person ? 'error-border' : ''}`}><input name="name_person" onChange={handleChange} value={formData.name_person} placeholder="Nombre(s)" /></div></div>
                  <div className="input-group"><div className={`input-pill ${errors.last_name_person ? 'error-border' : ''}`}><input name="last_name_person" onChange={handleChange} value={formData.last_name_person} placeholder="Apellido(s)" /></div></div>
                  <div className="input-group">
                    <div className={`input-pill combined ${errors.tax_id_number_person ? 'error-border' : ''}`}>
                      <Select instanceId="pref-ced" options={docTypes} value={prefijoCedula} onChange={setPrefijoCedula} placeholder="V" styles={prefixStyles} isSearchable={false} />
                      <div className="vert-divider"></div>
                      <input name="tax_id_number_person" onChange={handleChange} value={formData.tax_id_number_person} placeholder="Cédula / Pasaporte" type="number" />
                    </div>
                  </div>
                  <div className="input-group"><div className={`input-pill ${errors.mobile ? 'error-border' : ''}`}><input name="mobile" onChange={handleChange} value={formData.mobile} placeholder="Celular" /></div></div>
                  <div className="input-group"><div className={`input-pill ${errors.phone ? 'error-border' : ''}`}><input name="phone" onChange={handleChange} value={formData.phone} placeholder="Teléfono local" /></div></div>
                  <div className="input-group"><div className={`input-pill ${errors.email ? 'error-border' : ''}`}><input name="email" onChange={handleChange} value={formData.email} placeholder="Correo electrónico" type="email" /></div></div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="step-content">
                <div className="section-bar">Datos establecimiento</div>
                <div className="form-grid three-cols">
                  <div className="input-group">
                    <div className={`input-pill combined ${errors.tax_id_number ? 'error-border' : ''}`}>
                      <Select instanceId="pref-rif" options={docTypes} value={prefijoRif} onChange={setPrefijoRif} placeholder="J" styles={prefixStyles} isSearchable={false} />
                      <div className="vert-divider"></div>
                      <input name="tax_id_number" onChange={handleChange} value={formData.tax_id_number} placeholder="RIF" type="number" />
                    </div>
                  </div>
                  <div className="input-group"><div className={`input-pill ${errors.legal_name ? 'error-border' : ''}`}><input name="legal_name" onChange={handleChange} value={formData.legal_name} placeholder="Razón Social" /></div></div>
                  <div className="input-group"><div className={`input-pill ${errors.commercial_name ? 'error-border' : ''}`}><input name="commercial_name" onChange={handleChange} value={formData.commercial_name} placeholder="Nombre Comercial" /></div></div>
                </div>
                <div className="form-grid four-cols-custom" style={{ marginTop: '25px' }}>
                  <Select instanceId="f-state" options={states} placeholder="Estado" styles={customSelectStyles} onChange={handleFiscalState} value={fiscalState} hasError={!!errors.fiscalState} />
                  <Select instanceId="f-muni" options={fiscalMunis} placeholder="Municipio" styles={customSelectStyles} onChange={handleFiscalMuni} value={fiscalMuni} isDisabled={!fiscalState} hasError={!!errors.fiscalMuni} />
                  <Select instanceId="f-parish" options={fiscalParishes} placeholder="Parroquia" styles={customSelectStyles} onChange={handleFiscalParish} value={fiscalParish} isDisabled={!fiscalMuni} hasError={!!errors.fiscalParish} />
                  <div className={`input-pill ${errors.fiscal_address ? 'error-border' : ''}`}><input name="fiscal_address" onChange={handleChange} value={formData.fiscal_address} placeholder="Dirección Fiscal" /></div>
                </div>
                <div className="form-grid four-cols-custom">
                  <Select instanceId="s-state" options={states} placeholder="Estado" styles={customSelectStyles} onChange={handleServiceState} value={serviceState} hasError={!!errors.serviceState} />
                  <Select instanceId="s-muni" options={serviceMunis} placeholder="Municipio" styles={customSelectStyles} onChange={handleServiceMuni} value={serviceMuni} isDisabled={!serviceState} hasError={!!errors.serviceMuni} />
                  <Select instanceId="s-parish" options={serviceParishes} placeholder="Parroquia" styles={customSelectStyles} onChange={handleServiceParish} value={serviceParish} isDisabled={!serviceMuni} hasError={!!errors.serviceParish} />
                  <div className={`input-pill ${errors.service_location ? 'error-border' : ''}`}><input name="service_location" onChange={handleChange} value={formData.service_location} placeholder="Dirección Local" /></div>
                </div>
                <div className="form-grid two-cols">
                  <Select options={opcionesTenencia} value={tenenciaSelect} onChange={(v: any) => { setTenenciaSelect(v); setErrors({ ...errors, tenenciaSelect: null }) }} placeholder="Tenencia" styles={customSelectStyles} hasError={!!errors.tenenciaSelect} />
                  <div className={`input-pill ${errors.electricity_contract ? 'error-border' : ''}`}><input name="electricity_contract" onChange={handleChange} value={formData.electricity_contract} placeholder="Cuenta CORPOELEC" type="number" /></div>
                </div>
                <div className="form-grid four-cols">
                  <Select options={opcionesTrabajadores} placeholder="Trabajadores" styles={customSelectStyles} onChange={(v: any) => { setWorkersCount(v); setErrors({ ...errors, workersCount: null }) }} value={workersCount} hasError={!!errors.workersCount} />
                  <Select options={opcionesMesas} placeholder="Mesas" styles={customSelectStyles} onChange={(v: any) => { setTablesCount(v); setErrors({ ...errors, tablesCount: null }) }} value={tablesCount} hasError={!!errors.tablesCount} />
                  <div className={`input-pill input-date-wrapper ${errors.business_opening_date ? 'error-border' : ''}`}><input name="business_opening_date" type="date" onChange={handleChange} value={formData.business_opening_date} /></div>
                  <div className={`input-pill input-date-wrapper ${errors.document_date ? 'error-border' : ''}`}><input name="document_date" type="date" onChange={handleChange} value={formData.document_date} /></div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="step-content">
                <div className="area-box">
                  <div className="area-inputs">
                    <div className={`input-pill ${errors.area_size_full ? 'error-border' : ''}`}><input name="area_size_full" type="number" onChange={handleChange} value={formData.area_size_full} placeholder="Área total (m2)" /></div>
                    <div className={`input-pill ${errors.area_size_util ? 'error-border' : ''}`}><input name="area_size_util" type="number" onChange={handleChange} value={formData.area_size_util} placeholder="Área útil (m2)" /></div>
                  </div>
                  <div className="help-bar" onClick={() => setShowAreaModal(true)}>¿Cómo medir las áreas? <FaInfoCircle /></div>
                  <div className={`input-pill full-width ${errors.cnae_description ? 'error-border' : ''}`}><input name="cnae_description" onChange={handleChange} value={formData.cnae_description} placeholder="Descripción actividad comercial" /></div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="step-content">
                <div className="form-grid two-cols">
                  <div className={`file-pill ${errors.fileRif ? 'error-border' : ''}`}><label htmlFor="rif" className="file-btn"><FaUpload /></label><input id="rif" type="file" accept="application/pdf" hidden onChange={(e) => handleFileChange(e, 'rif')} /><span>RIF (PDF) {fileRif && '✔'}</span></div>
                  <div className={`file-pill ${errors.fileContrato ? 'error-border' : ''}`}><label htmlFor="con" className="file-btn"><FaUpload /></label><input id="con" type="file" accept="application/pdf" hidden onChange={(e) => handleFileChange(e, 'contrato')} /><span>Contrato / Doc (PDF) {fileContrato && '✔'}</span></div>
                </div>
              </div>
            )}

            <div className="btns-container" style={currentStep === 1 ? { justifyContent: 'flex-start', gap: '15px' } : undefined}>
              {currentStep === 1 && <button type="button" className="btn-back" onClick={() => window.location.href = 'https://fospuca-internacional-odoo.odoo.com/inico'}><FaArrowLeft /> Ir al inicio</button>}
              {currentStep > 1 && <button className="btn-back" onClick={handleBack}><FaArrowLeft /> Atrás</button>}
              {currentStep < 4 ? <button className="btn-next" onClick={handleNext}>Siguiente <FaArrowRight /></button> : <button className="btn-send" onClick={handleSubmit}>Enviar</button>}
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .activacion-page { background-color: #e6f2e8; min-height: 100vh; font-family: var(--font-poppins), sans-serif; display: flex; align-items: center; justify-content: center; padding: 40px 20px; }
        .form-container { width: 100%; max-width: 1050px; margin: 0 auto; }
        .main-content-box { background: #ffffffc7; border-radius: 35px; padding: 50px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08); backdrop-filter: blur(10px); }
        .hero-banner { background-image: url('/images/empresas/maracay.jpg'); background-size: cover; border-radius: 20px; overflow: hidden; margin-bottom: 20px; height: 160px; position: relative; }
        .hero-overlay { background: linear-gradient(90deg, rgba(76,183,0,0.95), rgba(76,183,0,0.4)); width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; padding: 0 40px; }
        .hero-text h1 { font-size: 28px; font-weight: 900; color: white; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        .hero-text p { font-size: 14px; color: white; max-width: 70%; margin-top: 5px; opacity: 0.95; font-weight: 400; }
        .section-bar { background-color: #4CB700; color: white; padding: 10px 25px; border-radius: 50px; font-weight: 900; font-size: 16px; text-align: center; margin-bottom: 25px; }
        .form-grid { display: grid; gap: 15px; margin-bottom: 15px; }
        .three-cols { grid-template-columns: 1fr 1fr 1fr; }
        .two-cols { grid-template-columns: 1fr 1fr; }
        .four-cols { grid-template-columns: 1fr 1fr 1fr 1fr; }
        .four-cols-custom { grid-template-columns: 1fr 1fr 1fr 2fr; }
        .input-pill { position: relative; width: 100%; }
        .input-pill input { width: 100%; background-color: white; border: 1px solid #ccc; border-radius: 10px; padding: 0 20px; height: 42px; font-size: 14px; outline: none; transition: 0.2s; font-family: var(--font-poppins); color: #333; }
        .input-pill input::placeholder { color: #888; }
        .input-pill input:focus { border-color: #4CB700; }
        .combined { display: flex; align-items: center; background-color: white; border-radius: 10px; border: 1px solid #ccc; padding: 0 5px 0 15px; }
        .combined input { border: none !important; }
        .vert-divider { width: 1px; height: 20px; background: #ccc; margin: 0 5px; }
        .area-box { background: white; padding: 25px; border-radius: 15px; border: 1px solid #ccc; }
        .area-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
        .help-bar { background: #4cb7002e; color: #555; font-weight: 700; padding: 10px; border-radius: 50px; cursor: pointer; font-size: 13px; margin-bottom: 15px; display: flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid #ddd; }
        .file-pill { background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 50px; padding: 10px 20px; display: flex; align-items: center; gap: 15px; width: 100%; transition: all 0.2s; }
        .file-pill span { font-size: 13px; color: #444; font-weight: 500; text-align: left; flex: 1; }
        .file-btn { background: #eee; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #555; }
        .file-btn:hover { background: #4CB700; color: white; }
        .btns-container { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }
        .btn-next, .btn-send { background: #4CB700; color: white; padding: 12px 40px; border-radius: 50px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 10px; }
        .btn-back { background: white; color: #777; border: 2px solid #ddd; padding: 12px 30px; border-radius: 50px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 10px; }
        .step-indicator { margin-bottom: 30px; text-align: right; color: #4CB700; font-weight: 900; font-size: 14px; }
        .progress-bar { height: 6px; background: #e0e0e0; border-radius: 3px; margin-top: 5px; overflow: hidden; }
        .progress-fill { height: 100%; background: #4CB700; transition: width 0.3s ease; }
        
        /* Modales iOS */
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(5px); display: flex; justify-content: center; align-items: center; z-index: 10000; }
        .ios-modal-content { background: white; border-radius: 32px; width: 90%; max-width: 420px; padding: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.25); display: flex; flex-direction: column; }
        .ios-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .ios-modal-header h3 { color: #111; }
        .ios-close-btn { background: #e4e4e4; color: #8e8e93; border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .ios-modal-subtitle { color: #333; }
        .ios-list-item { background: #d8434314; padding: 12px 16px; border-radius: 12px; display: flex; align-items: center; gap: 12px; font-size: 13px; font-weight: 600; color: #e11414; }
        .ios-info-text { color: #444; }
        .ios-info-card { background: #f2f2f7; padding: 15px; border-radius: 16px; margin-bottom: 10px; }
        .ios-info-card h4 { color: #222; }
        .ios-info-card p { color: #555; }
        .ios-btn-black { background: #1c1c1e; color: white; width: 100%; padding: 16px; border-radius: 18px; border: none; font-weight: 700; font-size: 16px; cursor: pointer; }

        @media (max-width: 768px) { .activacion-page { padding: 20px 10px; display: block; } .form-container { padding: 0; margin: 0 15px 15px 15px; } .main-content-box { padding: 2rem 1.5rem; } .three-cols, .two-cols, .four-cols, .four-cols-custom, .area-inputs { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
