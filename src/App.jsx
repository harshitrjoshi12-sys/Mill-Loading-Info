import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import imageCompression from 'browser-image-compression';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
  Plus, Trash2, Camera, Image as ImageIcon, Search, FileText, ArrowRight, ArrowLeft, LogOut, Calendar, X, Edit3, CheckCircle2, Share2, Truck, Sparkles
} from 'lucide-react';

// DIRECT SUPABASE CLIENT (Sabse safe tarika, kabhi break nahi hota)
const supabaseUrl = 'https://sofurgsfwulbhnnnarfj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvZnVyZ3Nmd3VsYmhubm5hcmZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMzE3NTQsImV4cCI6MjEwMzkwNzc1NH0.xv2snfag5gf18BkzCqYaSlIQw-QjWryvpOcuqqYLm9U';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const FACTORIES = [
  { id: 'pragya', name: "Pragya Product", gradient: "from-blue-600 to-indigo-700", border: "border-blue-500" },
  { id: 'shreeram', name: "Shreeram Agro Product", gradient: "from-emerald-600 to-teal-700", border: "border-emerald-500" }
];
const ITEMS = ["Mogar", "Mogar Polish", "Moong Dal", "Chilka", "Churi", "Moong Grading", "Other"];
const MARKAS = ["Shreeram", "Pragya", "Sunrise", "Dolphin", "Titanic", "Rajhans", "Chetak", "Star", "Plain"];
const PACKING_SIZES = ["50 kg", "40 kg", "30 kg", "25 kg", "Other"];
const COUNTS = ["None", "500 count", "550 count", "600 count", "700 count", "750 count"];

export default function App() {
  // Splash Screen State
  const [showSplash, setShowSplash] = useState(true);

  // Authentication
  const [role, setRole] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  
  // Navigation & Data
  const [activeTab, setActiveTab] = useState('new');
  const [currentStep, setCurrentStep] = useState(1);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Editing State
  const [editingRecordId, setEditingRecordId] = useState(null);

  // Form State
  const [factory, setFactory] = useState(FACTORIES[0].name);
  const [loadingDate, setLoadingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [partyName, setPartyName] = useState('');
  const [truckNo, setTruckNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverMobile, setDriverMobile] = useState('');

  // Product Details
  const [itemType, setItemType] = useState(ITEMS[0]);
  const [brandMarka, setBrandMarka] = useState(MARKAS[0]);
  const [countVal, setCountVal] = useState(COUNTS[0]);
  const [moistureVal, setMoistureVal] = useState('');
  const [packageSize, setPackageSize] = useState(PACKING_SIZES[0]);

  // Dhaang & Weight
  const [dhaange, setDhaange] = useState([{ bags: '', photo: null, preview: '', photoUrl: '' }]);
  const [netWeight, setNetWeight] = useState('');
  const [kantaPhoto, setKantaPhoto] = useState(null);
  const [kantaPreview, setKantaPreview] = useState('');
  const [kantaUrlSaved, setKantaUrlSaved] = useState('');

  // Auto-hide Splash Screen after 2.5s
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (role) fetchRecords();
  }, [role]);

  const handleKeypadPress = (val) => {
    if (pinInput.length < 4) setPinInput(prev => prev + val);
  };

  const handleKeypadClear = () => {
    setPinInput('');
    setPinError('');
  };

  const handleKeypadSubmit = () => {
    if (pinInput === '1111') {
      setRole('munim');
      setPinInput('');
      setPinError('');
    } else if (pinInput === '9999') {
      setRole('admin');
      setPinInput('');
      setPinError('');
    } else {
      setPinError('Galat PIN! Dubara dalein.');
      setPinInput('');
    }
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('truck_loadings')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setRecords(data);
    } catch (e) {
      console.error("Fetch Error:", e);
    } finally {
      setLoading(false);
    }
  };

  const compressAndUpload = async (file) => {
    if (!file) return null;
    try {
      const options = { maxSizeMB: 0.3, maxWidthOrHeight: 1024, useWebWorker: true };
      const compressed = await imageCompression(file, options);
      const fileExt = file.name ? file.name.split('.').pop() : 'jpg';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(6)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('loading-photos')
        .upload(fileName, compressed, { upsert: true });

      if (uploadError) {
        console.warn("Storage upload warning:", uploadError.message);
        return null;
      }

      const { data } = supabase.storage.from('loading-photos').getPublicUrl(fileName);
      return data?.publicUrl || null;
    } catch (err) {
      console.error("Upload error:", err);
      return null;
    }
  };

  const handleDhaangPhoto = (idx, file) => {
    if (!file) return;
    const updated = [...dhaange];
    updated[idx].photo = file;
    updated[idx].preview = URL.createObjectURL(file);
    setDhaange(updated);
  };

  const calculateTotalBags = () => {
    return dhaange.reduce((sum, d) => sum + (Number(d.bags) || 0), 0);
  };

  const resetForm = () => {
    setEditingRecordId(null);
    setCurrentStep(1);
    setPartyName('');
    setTruckNo('');
    setDriverName('');
    setDriverMobile('');
    setMoistureVal('');
    setNetWeight('');
    setLoadingDate(new Date().toISOString().split('T')[0]);
    setKantaPhoto(null);
    setKantaPreview('');
    setKantaUrlSaved('');
    setDhaange([{ bags: '', photo: null, preview: '', photoUrl: '' }]);
  };

  const handleEditRecord = (record) => {
    setEditingRecordId(record.id);
    setFactory(record.factory_name || FACTORIES[0].name);
    setLoadingDate(record.loading_date || new Date().toISOString().split('T')[0]);
    setTruckNo(record.truck_number || '');
    setDriverName(record.driver_name || '');
    setDriverMobile(record.driver_mobile || '');
    setNetWeight(record.net_weight ? String(record.net_weight) : '');
    setKantaUrlSaved(record.kanta_slip_url || '');
    setKantaPreview(record.kanta_slip_url || '');

    if (record.consignments && record.consignments.length > 0) {
      const c = record.consignments[0];
      setPartyName(c.partyName || '');
      setItemType(c.item || ITEMS[0]);
      setBrandMarka(c.marka || MARKAS[0]);
      setCountVal(c.count || COUNTS[0]);
      setMoistureVal(c.moisture || '');
      setPackageSize(c.packing || PACKING_SIZES[0]);
      if (c.dhaange && c.dhaange.length > 0) {
        setDhaange(c.dhaange.map(d => ({
          bags: d.bags || '',
          photo: null,
          preview: d.photoUrl || '',
          photoUrl: d.photoUrl || ''
        })));
      } else {
        setDhaange([{ bags: '', photo: null, preview: '', photoUrl: '' }]);
      }
    }

    setActiveTab('new');
    setCurrentStep(1);
  };

  const handleSubmitAll = async () => {
    if (!truckNo.trim()) {
      alert("Kripya Vehicle No. bharein!");
      return;
    }

    setLoading(true);
    try {
      const processedDhaange = await Promise.all(
        dhaange.map(async (d) => {
          let finalPhotoUrl = d.photoUrl || '';
          if (d.photo) {
            const uploaded = await compressAndUpload(d.photo);
            if (uploaded) finalPhotoUrl = uploaded;
          }
          return {
            bags: Number(d.bags) || 0,
            photoUrl: finalPhotoUrl
          };
        })
      );

      let finalKantaUrl = kantaUrlSaved || '';
      if (kantaPhoto) {
        const uploadedKanta = await compressAndUpload(kantaPhoto);
        if (uploadedKanta) finalKantaUrl = uploadedKanta;
      }

      const payload = {
        factory_name: factory,
        truck_number: truckNo.toUpperCase().trim(),
        driver_name: driverName.trim(),
        driver_mobile: driverMobile.trim(),
        loading_date: loadingDate || new Date().toISOString().split('T')[0],
        consignments: [
          {
            partyName: partyName.trim(),
            item: itemType,
            marka: brandMarka,
            packing: packageSize,
            count: countVal,
            moisture: moistureVal,
            dhaange: processedDhaange
          }
        ],
        net_weight: netWeight ? Number(netWeight) : null,
        kanta_slip_url: finalKantaUrl || null,
        status: 'fully_completed',
        created_by_role: role || 'munim'
      };

      if (editingRecordId) {
        const { error } = await supabase
          .from('truck_loadings')
          .update(payload)
          .eq('id', editingRecordId);
        if (error) throw new Error(error.message);
        alert("Entry Safaltapoorvak Update Ho Gayi!");
      } else {
        const { error } = await supabase.from('truck_loadings').insert([payload]);
        if (error) throw new Error(error.message);
        alert("Truck Loading & Despatch Safaltapoorvak Save Ho Gaya!");
      }

      resetForm();
      await fetchRecords();
      setActiveTab('history');
    } catch (err) {
      console.error(err);
      alert("Save nahi ho paya! Wajah: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 100% RELIABLE WHATSAPP DESPATCH REPORT (Har phone par turant kaam karega)
  const sendWhatsAppSlip = (record) => {
    const c = record.consignments?.[0] || {};
    
    let msg = `*DESPATCH LOADING SLIP*\n`;
    msg += `--------------------------------\n`;
    msg += `*Factory:* ${record.factory_name}\n`;
    msg += `*Gaadi No:* ${record.truck_number}\n`;
    msg += `*Date:* ${record.loading_date}\n`;
    msg += `*Party:* ${c.partyName || 'Direct'}\n`;
    msg += `*Item:* ${c.item || ''} (${c.marka || ''})\n`;
    msg += `*Packing:* ${c.packing || ''} | *Moisture:* ${c.moisture ? c.moisture + '%' : 'N/A'}\n`;
    msg += `*Driver:* ${record.driver_name || 'N/A'} (${record.driver_mobile || 'N/A'})\n`;
    msg += `--------------------------------\n`;
    msg += `*DHAANG DETAILS & PHOTO VERIFICATION:*\n`;

    (c.dhaange || []).forEach((d, idx) => {
      msg += `• Layer ${idx + 1}: *${d.bags || 0} Bags*`;
      if (d.photoUrl) {
        msg += ` ➔ Photo: ${d.photoUrl}\n`;
      } else {
        msg += ` (No Photo)\n`;
      }
    });

    msg += `--------------------------------\n`;
    msg += `*Net Weight:* ${record.net_weight ? record.net_weight + ' KG' : 'N/A'}\n`;
    if (record.kanta_slip_url) {
      msg += `*Kanta Slip Proof:* ${record.kanta_slip_url}\n`;
    }
    msg += `--------------------------------\n`;
    msg += `*Made by Harshit - Mill Loading Desk*`;

    const encodedMsg = encodeURIComponent(msg);
    window.open(`https://api.whatsapp.com/send?text=${encodedMsg}`, '_blank');
  };

  // NATIVE SHARE / PDF LOGIC
  const handleShareOrDownloadPDF = async (record) => {
    try {
      const doc = new jsPDF();
      const fileName = `Loading_${record.truck_number}.pdf`;

      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, 210, 26, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text((record.factory_name || 'FACTORY DESPATCH').toUpperCase(), 14, 16);
      doc.setFontSize(9);
      doc.setTextColor(253, 224, 71);
      doc.text("DESPATCH LOADING SLIP & DHANG VERIFICATION", 14, 22);

      const c = record.consignments?.[0] || {};
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.text(`Vehicle No: ${record.truck_number}`, 14, 34);
      doc.text(`Date: ${record.loading_date}`, 140, 34);
      doc.text(`Driver: ${record.driver_name || 'N/A'} (Mob: ${record.driver_mobile || 'N/A'})`, 14, 42);
      doc.text(`Party: ${c.partyName || 'Direct'} | Item: ${c.item || ''} | Marka: ${c.marka || ''}`, 14, 50);

      const rows = (c.dhaange || []).map((d, idx) => [
        `Dhaang Layer (${idx + 1})`,
        `${d.bags} Bags`,
        d.photoUrl ? 'Verified Proof' : 'No Photo'
      ]);

      doc.autoTable({
        startY: 56,
        head: [['Layer', 'Quantity', 'Verification']],
        body: rows,
        theme: 'striped',
        styles: { fontSize: 10 },
        didDrawCell: (data) => {
          const dPhoto = c.dhaange?.[data.row.index]?.photoUrl;
          if (data.section === 'body' && data.column.index === 2 && dPhoto) {
            doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: dPhoto });
          }
        }
      });

      const finalY = doc.lastAutoTable.finalY + 10;
      doc.text(`Net Weight: ${record.net_weight ? record.net_weight + ' KG' : 'N/A'}`, 14, finalY);

      const pdfBlob = doc.output('blob');
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Slip - ${record.truck_number}`,
          text: `Loading Slip for ${record.truck_number}`
        });
      } else {
        doc.save(fileName);
        alert("Slip file download trigger ho gayi hai!");
      }
    } catch (e) {
      alert("PDF banane me issue: " + e.message);
    }
  };

  const filteredRecords = records.filter(r => {
    const matchSearch = r.truck_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (r.consignments?.[0]?.partyName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const itemDate = r.loading_date;
    const matchStart = filterStartDate ? itemDate >= filterStartDate : true;
    const matchEnd = filterEndDate ? itemDate <= filterEndDate : true;
    return matchSearch && matchStart && matchEnd;
  });

  // 1. SPLASH SCREEN
  if (showSplash) {
    return (
      <div 
        onClick={() => setShowSplash(false)}
        className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white flex flex-col items-center justify-center p-6 select-none cursor-pointer relative overflow-hidden"
      >
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center text-center space-y-6 z-10">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-400 via-orange-500 to-yellow-300 p-1 shadow-2xl shadow-amber-500/30 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
              <Truck className="w-12 h-12 text-amber-400" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-400 uppercase drop-shadow-md">
              Loading Detail
            </h1>
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <p className="text-sm font-bold tracking-widest text-slate-200">
                Made by Harshit
              </p>
            </div>
          </div>

          <div className="pt-8">
            <div className="w-8 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // 2. PIN LOGIN SCREEN
  if (!role) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 text-white flex flex-col items-center justify-center p-4 select-none">
        <div className="w-full max-w-sm bg-slate-900/95 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-6 shadow-2xl flex flex-col items-center">
          
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-yellow-400 tracking-wide text-center">
            Loading Detail
          </h1>
          <p className="text-indigo-200 text-xs font-semibold mt-1">Terminal Security Login</p>

          <div className="flex justify-center gap-3 my-6">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-14 h-16 rounded-2xl border-2 flex items-center justify-center text-3xl font-black transition-all ${
                  pinInput.length > idx 
                    ? 'border-amber-400 bg-amber-400/20 text-amber-300 shadow-lg shadow-amber-400/30 scale-105' 
                    : 'border-slate-700 bg-slate-800/80 text-slate-500'
                }`}
              >
                {pinInput.length > idx ? '●' : ''}
              </div>
            ))}
          </div>

          {pinError && (
            <p className="text-rose-400 text-xs font-bold text-center mb-3 animate-pulse">
              {pinError}
            </p>
          )}

          <div className="grid grid-cols-3 gap-3 w-full">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleKeypadPress(num.toString())}
                className="h-16 rounded-2xl bg-gradient-to-b from-indigo-600 to-indigo-800 hover:from-indigo-500 active:scale-95 text-2xl font-black text-white border border-indigo-400/40 shadow-lg flex items-center justify-center transition"
              >
                {num}
              </button>
            ))}

            <button
              onClick={handleKeypadClear}
              className="h-16 rounded-2xl bg-gradient-to-b from-rose-600 to-rose-800 active:scale-95 text-2xl font-black text-white border border-rose-400/40 shadow-lg flex items-center justify-center transition"
            >
              ✕
            </button>

            <button
              onClick={() => handleKeypadPress('0')}
              className="h-16 rounded-2xl bg-gradient-to-b from-indigo-600 to-indigo-800 active:scale-95 text-2xl font-black text-white border border-indigo-400/40 shadow-lg flex items-center justify-center transition"
            >
              0
            </button>

            <button
              onClick={handleKeypadSubmit}
              className="h-16 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 active:scale-95 text-2xl font-black text-slate-950 shadow-lg shadow-amber-500/40 flex items-center justify-center transition"
            >
              ➔
            </button>
          </div>

          <div className="flex flex-col items-center mt-6 mb-1 space-y-1">
            <h2 className="text-sm font-black tracking-widest text-amber-300 uppercase">
              Enter PIN
            </h2>
            <span className="text-[11px] font-bold text-slate-400">
              Made by Harshit
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 3. MAIN APP
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col items-center">
      <header className="w-full bg-white border-b-2 border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button 
            onClick={() => { setRole(null); resetForm(); }} 
            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border-2 border-rose-300 rounded-xl text-xs font-black flex items-center gap-1 transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Exit
          </button>

          <div className="flex gap-2 flex-1 justify-end">
            <button
              onClick={() => { resetForm(); setActiveTab('new'); }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition ${
                activeTab === 'new' 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {editingRecordId ? 'Editing Truck' : 'New Truck'}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition ${
                activeTab === 'history' 
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Search & PDF
            </button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-md p-4 pb-24 flex flex-col justify-center">
        {activeTab === 'new' && (
          <div className="space-y-6">
            {editingRecordId && (
              <div className="bg-amber-100 border-2 border-amber-400 p-3 rounded-2xl flex items-center justify-between">
                <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-amber-700" /> Purani Entry Edit Kar Rahe Hain
                </span>
                <button 
                  onClick={resetForm} 
                  className="text-xs font-bold text-rose-700 bg-white px-2.5 py-1 rounded-xl border border-rose-300"
                >
                  Cancel Edit
                </button>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                {/* 1. Factory */}
                <div className="bg-white p-5 rounded-3xl border-2 border-blue-200 shadow-sm space-y-3">
                  <h2 className="text-base font-black uppercase tracking-wide text-blue-700 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">1</span>
                    Factory Unit
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {FACTORIES.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFactory(f.name)}
                        className={`p-4 rounded-2xl border-2 font-black text-sm text-center transition-all ${
                          factory === f.name 
                            ? `bg-gradient-to-br ${f.gradient} text-white ${f.border} shadow-lg scale-[1.02]` 
                            : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Loading Date */}
                <div className="bg-white p-5 rounded-3xl border-2 border-indigo-200 shadow-sm space-y-2">
                  <h2 className="text-base font-black uppercase tracking-wide text-indigo-700 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">2</span>
                    Loading Date
                  </h2>
                  <div className="relative">
                    <input
                      type="date"
                      value={loadingDate}
                      onChange={(e) => setLoadingDate(e.target.value)}
                      className="w-full bg-indigo-50/50 border-2 border-indigo-300 focus:border-indigo-600 focus:bg-white p-3.5 rounded-2xl font-mono text-base font-black text-slate-800 outline-none"
                    />
                  </div>
                </div>

                {/* 3. Party Detail */}
                <div className="bg-white p-5 rounded-3xl border-2 border-teal-200 shadow-sm space-y-2">
                  <h2 className="text-base font-black uppercase tracking-wide text-teal-700 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs">3</span>
                    Party Detail
                  </h2>
                  <label className="text-xs font-black text-slate-700 block">Name ➔</label>
                  <input
                    type="text"
                    placeholder="Enter Party / Grahak Name"
                    value={partyName}
                    onChange={(e) => setPartyName(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-300 focus:border-teal-500 focus:bg-white p-3.5 rounded-2xl text-base font-bold text-slate-800 outline-none"
                  />
                </div>

                {/* 4. Truck Detail */}
                <div className="bg-white p-5 rounded-3xl border-2 border-amber-200 shadow-sm space-y-3">
                  <h2 className="text-base font-black uppercase tracking-wide text-amber-700 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs">4</span>
                    Truck Detail
                  </h2>

                  <div>
                    <label className="text-xs font-black text-slate-700 block mb-1">Vehicle no. ➔ *</label>
                    <input
                      type="text"
                      placeholder="RJ 21 GA 1234"
                      value={truckNo}
                      onChange={(e) => setTruckNo(e.target.value.toUpperCase())}
                      className="w-full bg-amber-50/50 border-2 border-amber-300 focus:border-amber-600 focus:bg-white p-3.5 rounded-2xl font-mono text-2xl font-black text-slate-900 tracking-wider uppercase outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-700 block mb-1">Driver name ➔</label>
                    <input
                      type="text"
                      placeholder="Enter Driver Name"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-300 focus:border-amber-500 focus:bg-white p-3 rounded-xl text-sm font-bold text-slate-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-700 block mb-1">Driver Mb. no. ➔</label>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      value={driverMobile}
                      onChange={(e) => setDriverMobile(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-300 focus:border-amber-500 focus:bg-white p-3 rounded-xl font-mono text-sm font-bold text-slate-800 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!truckNo.trim()) return alert("Kripya Vehicle No. bharein!");
                    setCurrentStep(2);
                  }}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-black text-base uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 active:scale-98 transition"
                >
                  Agla Page: Product Detail <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-3xl border-2 border-purple-200 shadow-sm space-y-4">
                  <h2 className="text-base font-black uppercase tracking-wide text-purple-700 border-b pb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs">5</span>
                    Product Detail
                  </h2>

                  <div>
                    <label className="text-xs font-black text-slate-700 block mb-1.5">Type</label>
                    <select
                      value={itemType}
                      onChange={(e) => setItemType(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-300 focus:border-purple-500 p-3 rounded-xl font-bold text-slate-900 text-sm outline-none"
                    >
                      {ITEMS.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-700 block mb-1.5">Brand / Marka</label>
                    <select
                      value={brandMarka}
                      onChange={(e) => setBrandMarka(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-300 focus:border-purple-500 p-3 rounded-xl font-bold text-slate-900 text-sm outline-none"
                    >
                      {MARKAS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-700 block mb-1.5">Count</label>
                    <select
                      value={countVal}
                      onChange={(e) => setCountVal(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-300 focus:border-purple-500 p-3 rounded-xl font-bold text-slate-900 text-sm outline-none"
                    >
                      {COUNTS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-700 block mb-1.5">Moisture %</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 11.5"
                      value={moistureVal}
                      onChange={(e) => setMoistureVal(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-300 focus:border-purple-500 p-3 rounded-xl font-mono text-sm font-bold text-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-700 block mb-1.5">Package Size</label>
                    <select
                      value={packageSize}
                      onChange={(e) => setPackageSize(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-300 focus:border-purple-500 p-3 rounded-xl font-bold text-slate-900 text-sm outline-none"
                    >
                      {PACKING_SIZES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 py-4 rounded-2xl bg-white border-2 border-slate-300 text-slate-700 font-black text-sm flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" /> Peeche
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white font-black text-base uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 active:scale-98 transition"
                  >
                    Agla: Dhaang Detail <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-3xl border-2 border-emerald-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h2 className="text-base font-black uppercase tracking-wide text-emerald-700 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">6</span>
                      Dhaang Detail
                    </h2>
                    <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-3 py-1 rounded-xl">
                      Total: {calculateTotalBags()} Bags
                    </span>
                  </div>

                  <div className="space-y-3">
                    {dhaange.map((d, dIdx) => (
                      <div key={dIdx} className="bg-slate-50 p-3 rounded-2xl border-2 border-slate-200 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-700 w-20">
                            Dhaang ({dIdx + 1})
                          </span>

                          <input
                            type="number"
                            placeholder="Bags"
                            value={d.bags}
                            onChange={(e) => {
                              const updated = [...dhaange];
                              updated[dIdx].bags = e.target.value;
                              setDhaange(updated);
                            }}
                            className="w-20 bg-white border-2 border-emerald-400 p-2 rounded-xl font-mono text-base font-black text-slate-900 text-center outline-none"
                          />

                          {/* DIRECT CAMERA CLICK */}
                          <label className={`p-2.5 rounded-xl border-2 flex items-center justify-center gap-1 cursor-pointer font-black text-xs transition ${
                            d.photo || d.preview || d.photoUrl
                              ? 'bg-emerald-600 text-white border-emerald-700' 
                              : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                          }`}>
                            <Camera className="w-4 h-4" />
                            <span className="hidden sm:inline">Camera</span>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={(e) => handleDhaangPhoto(dIdx, e.target.files[0])}
                            />
                          </label>

                          {/* GALLERY / FILE */}
                          <label className="p-2.5 rounded-xl border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer font-black text-xs transition">
                            <ImageIcon className="w-4 h-4" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleDhaangPhoto(dIdx, e.target.files[0])}
                            />
                          </label>

                          {dhaange.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setDhaange(dhaange.filter((_, i) => i !== dIdx))}
                              className="text-rose-500 p-1 ml-auto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {(d.preview || d.photoUrl) && (
                          <div className="relative rounded-xl overflow-hidden h-24 border-2 border-emerald-200">
                            <img src={d.preview || d.photoUrl} alt="Dhaang Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setDhaange([...dhaange, { bags: '', photo: null, preview: '', photoUrl: '' }])}
                    className="w-full py-3 bg-emerald-50 text-emerald-700 border-2 border-dashed border-emerald-300 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Plus className="w-4 h-4" /> Add Dhaang ({dhaange.length + 1})
                  </button>
                </div>

                <div className="bg-white p-5 rounded-3xl border-2 border-indigo-200 shadow-sm space-y-3">
                  <h2 className="text-base font-black uppercase tracking-wide text-indigo-700 border-b pb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">7</span>
                    Weight Slip / Kanta Slip
                  </h2>

                  <label className="text-xs font-black text-slate-700 block">Net weight</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Net Wt in KG"
                      value={netWeight}
                      onChange={(e) => setNetWeight(e.target.value)}
                      className="flex-1 bg-slate-50 border-2 border-slate-300 focus:border-indigo-500 focus:bg-white p-3 rounded-2xl font-mono text-base font-black text-slate-900 outline-none"
                    />

                    {/* Camera for Kanta */}
                    <label className={`p-3.5 rounded-2xl border-2 flex items-center justify-center gap-1 cursor-pointer font-black text-xs transition ${
                      kantaPhoto || kantaUrlSaved || kantaPreview
                        ? 'bg-indigo-600 text-white border-indigo-700' 
                        : 'bg-indigo-50 text-indigo-700 border-indigo-300'
                    }`}>
                      <Camera className="w-5 h-5" />
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files[0]) {
                            setKantaPhoto(e.target.files[0]);
                            setKantaPreview(URL.createObjectURL(e.target.files[0]));
                          }
                        }}
                      />
                    </label>

                    {/* Gallery for Kanta */}
                    <label className="p-3.5 rounded-2xl border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer font-black text-xs transition">
                      <ImageIcon className="w-5 h-5" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files[0]) {
                            setKantaPhoto(e.target.files[0]);
                            setKantaPreview(URL.createObjectURL(e.target.files[0]));
                          }
                        }}
                      />
                    </label>
                  </div>

                  {(kantaPreview || kantaUrlSaved) && (
                    <div className="rounded-2xl overflow-hidden h-28 border-2 border-indigo-200 mt-2">
                      <img src={kantaPreview || kantaUrlSaved} alt="Slip Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="flex-1 py-4 rounded-2xl bg-white border-2 border-slate-300 text-slate-700 font-black text-sm flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" /> Peeche
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleSubmitAll}
                    className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white font-black text-base uppercase tracking-wider shadow-xl flex items-center justify-center gap-2 active:scale-98 transition disabled:opacity-50"
                  >
                    {loading ? 'Saving Changes...' : editingRecordId ? 'Update Changes' : 'Save & Despatch'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SEARCH, DATE FILTER, VIEW/EDIT & PDF */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-4" />
              <input
                type="text"
                placeholder="Search Truck No or Party..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border-2 border-slate-300 p-3.5 pl-11 rounded-2xl text-sm font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-purple-500 shadow-sm"
              />
            </div>

            {/* Date Filters Box */}
            <div className="bg-white p-4 rounded-2xl border-2 border-purple-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> Search By Date
                </span>
                {(filterStartDate || filterEndDate) && (
                  <button
                    onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }}
                    className="text-xs font-bold text-rose-600 flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Clear Date
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">From Date</label>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-300 focus:border-purple-500 p-2 rounded-xl text-xs font-bold font-mono text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">To Date</label>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-300 focus:border-purple-500 p-2 rounded-xl text-xs font-bold font-mono text-slate-800 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Records List */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500 px-1">
                Showing {filteredRecords.length} records
              </p>

              {filteredRecords.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-3xl border-2 border-dashed border-slate-300 text-slate-400 font-bold text-sm">
                  Koi record nahi mila
                </div>
              ) : (
                filteredRecords.map(r => (
                  <div key={r.id} className="bg-white p-4 rounded-3xl border-2 border-slate-200 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-mono font-black text-lg text-slate-900">{r.truck_number}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                            {r.factory_name}
                          </span>
                          <span className="text-xs font-black font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {r.loading_date}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-black uppercase px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl flex justify-between">
                      <span>Party: <strong>{r.consignments?.[0]?.partyName || 'Direct'}</strong></span>
                      <span>Net Wt: <strong>{r.net_weight ? `${r.net_weight} kg` : 'N/A'}</strong></span>
                    </div>

                    {/* ACTION BUTTONS (Edit, WhatsApp Report & PDF) */}
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      <button
                        onClick={() => handleEditRecord(r)}
                        className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs rounded-xl flex items-center justify-center gap-1 border border-slate-300 active:scale-95 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-600" /> Edit
                      </button>

                      <button
                        onClick={() => sendWhatsAppSlip(r)}
                        className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1 shadow-md active:scale-95 transition"
                      >
                        <Share2 className="w-3.5 h-3.5" /> WhatsApp
                      </button>

                      <button
                        onClick={() => handleShareOrDownloadPDF(r)}
                        className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1 shadow-md active:scale-95 transition"
                      >
                        <FileText className="w-3.5 h-3.5" /> PDF
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
