import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { CalculatorIcon, CurrencyDollarIcon, TrashIcon, PrinterIcon } from '@heroicons/react/24/solid';
import { useSpring, animated } from 'react-spring';
import { Toaster, toast } from 'sonner';
import InputField from './components/InputField';
import SummaryItem from './components/SummaryItem';

const App: React.FC = () => {
  const [subtotal, setSubtotal] = useState<string>('');
  const [discount, setDiscount] = useState<string>('');
  const [cash, setCash] = useState<string>('');
  const [deposit, setDeposit] = useState<string>('');
  const [applyFinancingFee, setApplyFinancingFee] = useState(false);
      const [applyDeliveryFee, setApplyDeliveryFee] = useState(false);
  type Location = 'royal' | 'lales';
    const [location, setLocation] = useState<Location>('royal');
  const [applyLaboratoryFee, setApplyLaboratoryFee] = useState(false);
  const [clientName, setClientName] = useState('');
      const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [isPrintEnabled, setIsPrintEnabled] = useState(false);
    const [displayTotal, setDisplayTotal] = useState(0);

  // HighLevel API State
  const [searchInvoiceNumber, setSearchInvoiceNumber] = useState('');
  const [highLevelInvoiceData, setHighLevelInvoiceData] = useState<any>(null);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);
  const [invoiceSearchError, setInvoiceSearchError] = useState('');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  
  // --- Google Sheets API Config ---
  // IMPORTANT: Replace with your actual credentials
  const SPREADSHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID;



  const handleInputChange = useCallback((setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    // Allow empty string, numbers, and a single decimal point. Disallow negative values.
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setter(value);
    }
  }, []);

  const clearFields = useCallback(() => {
    setSubtotal('');
    setDiscount('');
    setCash('');
    setDeposit('');
    setApplyFinancingFee(false);
        setApplyDeliveryFee(false);
            setApplyLaboratoryFee(false);
    setDisplayTotal(0);
    setClientName('');
    setInvoiceNumber('');
    setIsPrintEnabled(false);
    // Reset HighLevel state
    setSearchInvoiceNumber('');
    setHighLevelInvoiceData(null);
    setIsLoadingInvoice(false);
    setInvoiceSearchError('');
    setIsPreviewModalOpen(false);
  }, []);

  const numericSubtotal = useMemo(() => parseFloat(subtotal) || 0, [subtotal]);
  const numericDiscount = useMemo(() => parseFloat(discount) || 0, [discount]);
  const numericCash = useMemo(() => parseFloat(cash) || 0, [cash]);
  const numericDeposit = useMemo(() => parseFloat(deposit) || 0, [deposit]);

  const baseAmount = useMemo(() => {
    const result = numericSubtotal - numericDiscount - numericCash - numericDeposit;
    return result > 0 ? result : 0;
  }, [numericSubtotal, numericDiscount, numericCash, numericDeposit]);

  const taxes = useMemo(() => baseAmount * 0.07, [baseAmount]);

  const subtotalAfterTaxes = useMemo(() => baseAmount + taxes, [baseAmount, taxes]);

  const netSubtotal = useMemo(() => {
    return subtotalAfterTaxes;
  }, [subtotalAfterTaxes]);
  
  const financingFee = useMemo(() => {
    return applyFinancingFee ? netSubtotal * 0.10 : 0;
  }, [netSubtotal, applyFinancingFee]);

  const deliveryFee = useMemo(() => {
    return applyDeliveryFee ? 100 : 0;
  }, [applyDeliveryFee]);

    const laboratoryFee = useMemo(() => {
    return applyLaboratoryFee ? 150 : 0;
  }, [applyLaboratoryFee]);

          const finalTotal = useMemo(() => netSubtotal + financingFee + deliveryFee + laboratoryFee, [netSubtotal, financingFee, deliveryFee, laboratoryFee]);

  const { animatedTotal } = useSpring({
    from: { animatedTotal: 0 },
    to: { animatedTotal: displayTotal },
    config: { duration: 750 },
  });

  const locationData = {
    royal: {
      name: 'Royal Beauty',
      address: '13238 SW Eighth St Miami, FL 33184, US',
      phone: '786-553-7310',
      logo: './royal-beauty-logo.png',
    },
    lales: {
      name: "Lale's Plastic Surgery",
      address: '13238 SW Eighth St Miami, FL 33184, US',
      phone: '786-981-8487',
      logo: './lales-logo.png',
    },
  };

  const currentOffice = locationData[location];

  const sendDataToSheet = async () => {
    const data = {
      timestamp: new Date().toISOString(),
      officeName: currentOffice.name,
      clientName,
      invoiceNumber: location !== 'royal' ? `INV-${invoiceNumber}` : 'N/A',
      subtotal: numericSubtotal,
      discount: numericDiscount,
      cash: numericCash,
      taxes,
      deposit: numericDeposit,
      financingFee,
      deliveryFee,
      laboratoryFee,
      finalTotal,
    };

    try {
      const response = await fetch('/api/sendToSheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.message || 'Failed to send data');
      }

      console.log('Data sent successfully!');
      toast.success('Todo salio bien!');
    } catch (error: any) {
      console.error('Error algo salio mal:', error);
      toast.error(`Error: ${error.message}`);
    }
  };

  const handleConfirmDetails = () => {
    if (clientName.trim() === '') {
      toast.warning('Please fill in the client name.');
      return;
    }
    if (location !== 'royal' && invoiceNumber.trim() === '') {
      toast.warning('Please fill in the invoice number.');
      return;
    }
    setIsDetailModalOpen(false);
    setDisplayTotal(finalTotal);
    setIsPrintEnabled(true);
    sendDataToSheet();
    // Después de confirmar, busca la factura en HighLevel si el número existe
    if (location !== 'royal' && invoiceNumber.trim() !== '') {
      handleSearchInvoice();
    }
  };

  const handleInvoiceNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 6) {
      setInvoiceNumber(value);
    }
  };

  const handleInvoiceNumberBlur = () => {
    if (invoiceNumber) {
      setInvoiceNumber(invoiceNumber.padStart(6, '0'));
    }
  };

  const handlePrint = () => {
    if (!isPrintEnabled) return;

    if (location === 'lales' && invoiceNumber.trim() === '') {
      toast.warning("Ingresa el numero de invoice 'INV-' antes de imprimir, presionando el boton Calculate.");
      return;
    }
    setTimeout(() => {
      window.print();
    }, 100);
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const handleSearchInvoice = async () => {
    // Usamos el `invoiceNumber` del modal de detalles
    const searchNumber = invoiceNumber.trim();
    if (!searchNumber) {
      toast.warning('Please enter the invoice number in the details modal first.');
      return;
    }
    setIsLoadingInvoice(true);
    setInvoiceSearchError('');
    setHighLevelInvoiceData(null);

    try {
      // El backend ahora busca por `invoiceNumber`
      const response = await fetch(`/api/highlevel?invoiceNumber=${searchNumber}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch invoice data.');
      }

      setHighLevelInvoiceData(data.invoice);
      toast.success('HighLevel Invoice found!');
    } catch (error: any) {
      setInvoiceSearchError(error.message);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoadingInvoice(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!highLevelInvoiceData) return;

    let requestBody: any;
    let amountToPay: number;
    const pendingSchedules = highLevelInvoiceData.paymentSchedule?.schedules?.filter(
      (s: any) => s.status === 'pending'
    ) || [];

    if (pendingSchedules.length > 0) {
      // Caso 1: La factura tiene un plan de pagos con cuotas pendientes
      amountToPay = pendingSchedules.reduce((sum: number, s: any) => sum + s.value, 0);
      const scheduleIds = pendingSchedules.map((s: any) => s._id);
      requestBody = {
        mode: 'other',
        notes: 'Pago hecho en Frontdesk',
        amount: amountToPay,
        paymentScheduleIds: scheduleIds,
        fulfilledAt: new Date().toISOString(),
      };
    } else {
      // Caso 2: La factura no tiene plan de pagos o ya está todo pagado
      amountToPay = highLevelInvoiceData.total - highLevelInvoiceData.amountPaid;
      if (amountToPay <= 0) {
        toast.info('This invoice has no pending balance.');
        return;
      }
      requestBody = {
        mode: 'other',
        notes: 'Pago hecho en Frontdesk',
        amount: amountToPay,
        fulfilledAt: new Date().toISOString(),
      };
    }

    try {
      const response = await fetch(`/api/highlevel?invoiceId=${highLevelInvoiceData._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to mark as paid.');
      }

      // Actualizar el estado local de la factura para reflejar el pago
      setHighLevelInvoiceData((prevData: any) => {
        const newAmountPaid = prevData.amountPaid + amountToPay;
        const isFullyPaid = newAmountPaid >= prevData.total;

        let updatedSchedules = prevData.paymentSchedule?.schedules;
        if (pendingSchedules.length > 0) {
          const paidScheduleIds = pendingSchedules.map((s: any) => s._id);
          updatedSchedules = prevData.paymentSchedule.schedules.map((s: any) => 
            paidScheduleIds.includes(s._id) ? { ...s, status: 'paid' } : s
          );
        }

        return {
          ...prevData,
          status: isFullyPaid ? 'paid' : 'partially_paid',
          amountPaid: newAmountPaid,
          paymentSchedule: updatedSchedules ? {
            ...prevData.paymentSchedule,
            schedules: updatedSchedules,
          } : prevData.paymentSchedule,
        };
      });

      toast.success('Pago registrado exitosamente!');
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 sm:p-6 lg:p-8 print:bg-white print:min-h-0 print:p-0">
      <main className="w-full max-w-4xl mx-auto">
        <div className="bg-gray-800 shadow-2xl rounded-2xl overflow-hidden print:shadow-none print:rounded-none">
                    <div className="px-6 py-8 sm:px-10">
                                    <div className="hidden print:block mb-8 text-black">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <img src={currentOffice.logo} alt={`${currentOffice.name} Logo`} className="w-20 h-auto" />
                  <div>
                    <h1 className="text-3xl font-bold">{currentOffice.name}</h1>
                    <p>{currentOffice.address}</p>
                    <p>Phone: {currentOffice.phone}</p>
                  </div>
                </div>
                                <div className="text-right">
                  <h2 className="text-4xl font-bold text-gray-700">INVOICE</h2>
                                    {location !== 'royal' && invoiceNumber && <p className="text-lg font-semibold text-gray-600">INV-{invoiceNumber}</p>}
                </div>
              </div>
              <div className="mt-8 pt-4 border-t border-gray-300">
                <h3 className="text-lg font-semibold text-gray-800">Billed to:</h3>
                <p className="text-xl">{clientName}</p>
              </div>
            </div>
            
            <div className="text-center print:hidden">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
                Invoice Total Calculator
              </h1>
              <p className="mt-2 text-lg text-gray-400">
                Calculate your final invoice amount in real-time.
              </p>
            </div>



            
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 print:grid-cols-1">
              {/* Input Form */}
              <div className="space-y-6 print:hidden">
                <InputField
                  label="Subtotal"
                  id="subtotal"
                  value={subtotal}
                  onChange={handleInputChange(setSubtotal)}
                  placeholder="e.g., 1000.00"
                  required
                />
                <InputField
                  label="Discount"
                  id="discount"
                  value={discount}
                  onChange={handleInputChange(setDiscount)}
                  placeholder="e.g., 50.00"
                />
                <InputField
                  label="Cash"
                  id="cash"
                  value={cash}
                  onChange={handleInputChange(setCash)}
                  placeholder="e.g., 100.00"
                />
                <InputField
                  label="Deposit"
                  id="deposit"
                  value={deposit}
                  onChange={handleInputChange(setDeposit)}
                  placeholder="e.g., 200.00"
                  required
                />
                <div className="flex items-center pt-2">
                  <input
                    id="financing-fee-checkbox"
                    type="checkbox"
                    checked={applyFinancingFee}
                    onChange={(e) => setApplyFinancingFee(e.target.checked)}
                    className="h-5 w-5 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-600 focus:ring-offset-gray-800"
                  />
                  <label htmlFor="financing-fee-checkbox" className="ml-3 text-lg text-gray-300">
                  Aplicar Financiamiento (10%)
                  </label>
                </div>
                <div className="flex items-center pt-2">
                  <input
                    id="delivery-fee-checkbox"
                    type="checkbox"
                    checked={applyDeliveryFee}
                    onChange={(e) => setApplyDeliveryFee(e.target.checked)}
                    className="h-5 w-5 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-600 focus:ring-offset-gray-800"
                  />
                  <label htmlFor="delivery-fee-checkbox" className="ml-3 text-lg text-gray-300">
                  Delivery de Medicamentos ($100)
                  </label>
                </div>
                <div className="flex items-center pt-2">
                  <input
                    id="laboratory-fee-checkbox"
                    type="checkbox"
                    checked={applyLaboratoryFee}
                    onChange={(e) => setApplyLaboratoryFee(e.target.checked)}
                    className="h-5 w-5 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-600 focus:ring-offset-gray-800"
                  />
                  <label htmlFor="laboratory-fee-checkbox" className="ml-3 text-lg text-gray-300">
                  Examenes de Laboratorios ($150)
                  </label>
                </div>
                 <div className="mb-6 print:hidden">
                  <div className="flex items-center justify-center bg-gray-700/50 p-1 rounded-full max-w-sm mx-auto">
                    <button
                      onClick={() => setLocation('royal')}
                      className={`w-1/2 py-2 text-sm font-bold rounded-full transition-colors ${location === 'royal' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                    >
                      Royal Beauty
                    </button>
                    <button
                      onClick={() => setLocation('lales')}
                      className={`w-1/2 py-2 text-sm font-bold rounded-full transition-colors ${location === 'lales' ? 'bg-amber-400 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                    >
                      Lale's Plastic Surgery
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-4 pt-4 print:hidden">
                  <div className="flex flex-col sm:flex-row gap-4">
                                        <button
                      type="button"
                      onClick={() => setIsDetailModalOpen(true)}
                      className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm transition-colors text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
                    >
                      <CalculatorIcon className="w-5 h-5 mr-2" />
                      Calculate
                    </button>
                    <button
                      type="button"
                      onClick={clearFields}
                      className="w-full inline-flex justify-center items-center px-6 py-3 border border-gray-600 text-base font-medium rounded-md shadow-sm text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500 transition-colors"
                    >
                      <TrashIcon className="w-5 h-5 mr-2" />
                      Clear Fields
                    </button>
                  </div>
                                    <button
                    type="button"
                    onClick={handlePrint}
                    disabled={!isPrintEnabled}
                    className="w-full inline-flex justify-center items-center px-6 py-3 border border-gray-600 text-base font-medium rounded-md shadow-sm transition-colors disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500"
                  >
                    <PrinterIcon className="w-5 h-5 mr-2" />
                    Print
                  </button>
                </div>
              </div>

              {/* Summary & Total */}
              <div className="bg-gray-900/50 p-6 rounded-lg flex flex-col print:bg-white print:p-0 print:text-black">
                <h2 className="text-xl font-bold text-gray-200 border-b border-gray-700 pb-3 mb-4 print:text-black print:border-gray-300">
                  Summary
                </h2>
                <div className="space-y-3 text-lg flex-grow">
                  <SummaryItem label="Subtotal" value={formatCurrency(numericSubtotal)} />
                  <SummaryItem label="Discount" value={`- ${formatCurrency(numericDiscount)}`} isNegative />
                  <SummaryItem label="Cash" value={`- ${formatCurrency(numericCash)}`} isNegative />
                  <SummaryItem label="Taxes (7%)" value={formatCurrency(taxes)} />
                  <SummaryItem label="Deposit" value={`- ${formatCurrency(numericDeposit)}`} isNegative />
                  {applyFinancingFee && <SummaryItem label="Aplicar Financiamiento (10%)" value={formatCurrency(financingFee)} />}
                  {applyDeliveryFee && <SummaryItem label="Delivery de Medicamentos" value={formatCurrency(deliveryFee)} />}
                                    {applyLaboratoryFee && <SummaryItem label="Examenes de Laboratorios" value={formatCurrency(laboratoryFee)} />}
                </div>
                <div className="mt-8 pt-4 border-t-2 border-blue-400">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-semibold text-gray-300 print:text-black">Final Total</span>
                    <span className="text-3xl sm:text-4xl font-extrabold text-teal-300 tracking-tight print:text-black">
                      <animated.span>
                        {animatedTotal.to((val) => formatCurrency(val))}
                      </animated.span>
                    </span>
                  </div>
                </div>

                {/* HighLevel Invoice Button Area */}
                <div className="mt-6 print:hidden">
                  {isLoadingInvoice && <p className="text-center text-purple-300">Searching for HighLevel invoice...</p>}
                  {invoiceSearchError && <p className="text-center text-red-400">HighLevel Error: {invoiceSearchError}</p>}
                  {location === 'lales' && invoiceNumber.trim() !== '' && highLevelInvoiceData && (
                    <button
                      onClick={() => setIsPreviewModalOpen(true)}
                      className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-emerald-500 transition-colors"
                    >
                      <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                      Correr el Pago
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Toaster richColors theme="dark" />

      {/* HighLevel Invoice Preview Modal */}
      {isPreviewModalOpen && highLevelInvoiceData && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4">
          <div className="bg-gray-700 p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-white text-xl font-bold mb-4">Invoice Preview</h3>
            <div className="space-y-2 text-gray-300">
              <p><strong>Invoice #:</strong> {highLevelInvoiceData.invoiceNumber}</p>
              <p><strong>Client:</strong> {highLevelInvoiceData.contactDetails.name}</p>
              <p><strong>Email:</strong> {highLevelInvoiceData.contactDetails.email}</p>
              <p><strong>Total:</strong> {formatCurrency(highLevelInvoiceData.total)}</p>
              <p><strong>Amount Paid:</strong> {formatCurrency(highLevelInvoiceData.amountPaid)}</p>
              <p><strong>Status:</strong> <span className={`font-bold ${highLevelInvoiceData.status === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>{highLevelInvoiceData.status}</span></p>
            </div>
            <div className="mt-6 space-y-4">
              {highLevelInvoiceData.status !== 'paid' && (
                <button
                  onClick={handleMarkAsPaid}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500"
                >
                  Marcar como pagado
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="w-full px-4 py-2 border border-gray-600 text-base font-medium rounded-md shadow-sm text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {isDetailModalOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4 print:hidden">
          <div className="bg-gray-700 p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-white text-xl font-bold mb-4">Invoice Details</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="clientName" className="block text-sm font-medium text-gray-300 mb-1">Client Name</label>
                <input
                  id="clientName"
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Full Name"
                  autoFocus
                />
              </div>
                            {location !== 'royal' && (
                <div>
                  <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-300 mb-1">Invoice Number</label>
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-600 bg-gray-800 text-gray-400 sm:text-sm">INV-</span>
                    <input
                      id="invoiceNumber"
                      type="tel" // Use 'tel' to encourage numeric keyboard on mobile
                      value={invoiceNumber}
                      onChange={handleInvoiceNumberChange}
                      onBlur={handleInvoiceNumberBlur}
                      placeholder="000000"
                      className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 border border-gray-600 text-base font-medium rounded-md shadow-sm text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDetails}
                className="px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
              >
                Confirm & Calculate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
