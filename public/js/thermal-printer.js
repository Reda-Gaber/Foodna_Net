/**
 * Thermal Printer - طابعة حرارية
 * مكتبة لطباعة الإيصالات على الطابعات الحرارية (80mm / 58mm)
 * 
 * الاستخدام:
 * const printer = new ThermalPrinter();
 * printer.addReceipt(receiptData);
 * printer.printThermal(); // للطابعة المتصلة
 * printer.printBrowser(); // الطباعة العادية
 */

class ThermalPrinter {
  constructor(width = 80) {
    this.width = width; // 80mm أو 58mm
    this.charWidth = width === 80 ? 48 : 32; // عدد الأحرف في السطر
    this.content = '';
    this.lineHeight = 1.5;
  }

  /**
   * إضافة نص عادي
   */
  addLine(text = '', align = 'right') {
    const line = this._formatLine(text, align);
    this.content += line + '\n';
    return this;
  }

  /**
   * إضافة عنوان (بخط غامق)
   */
  addTitle(text) {
    this.content += this._repeat('=', this.charWidth) + '\n';
    this.addLine(text, 'center');
    this.content += this._repeat('=', this.charWidth) + '\n';
    return this;
  }

  /**
   * إضافة عنوان فرعي
   */
  addSubTitle(text) {
    this.content += this._repeat('-', this.charWidth) + '\n';
    this.addLine(text, 'center');
    this.content += this._repeat('-', this.charWidth) + '\n';
    return this;
  }

  /**
   * إضافة صف بعمودين (مثالي للسعر والكمية)
   */
  addRow(left, right, padding = '.') {
    const maxLeft = Math.floor(this.charWidth * 0.65);
    const maxRight = Math.floor(this.charWidth * 0.35);
    
    const leftText = String(left || '').substring(0, maxLeft).padEnd(maxLeft);
    const rightText = String(right || '').substring(0, maxRight);
    
    let paddingLength = this.charWidth - leftText.length - rightText.length;
    if (paddingLength < 0) paddingLength = 0;
    
    const paddingStr = this._repeat(padding, paddingLength);
    this.content += `${leftText}${paddingStr}${rightText}\n`;
    return this;
  }

  /**
   * إضافة صف بثلاثة أعمدة
   */
  addRowThree(col1, col2, col3) {
    const width1 = Math.floor(this.charWidth * 0.4);
    const width2 = Math.floor(this.charWidth * 0.3);
    const width3 = Math.floor(this.charWidth * 0.3);
    
    const text1 = String(col1 || '').substring(0, width1).padEnd(width1);
    const text2 = String(col2 || '').substring(0, width2).padEnd(width2);
    const text3 = String(col3 || '').substring(0, width3).padEnd(width3);
    
    this.content += `${text1}${text2}${text3}\n`;
    return this;
  }

  /**
   * إضافة فاصل
   */
  addSeparator(char = '-') {
    this.content += this._repeat(char, this.charWidth) + '\n';
    return this;
  }

  /**
   * إضافة فراغ
   */
  addBlankLines(count = 1) {
    for (let i = 0; i < count; i++) {
      this.content += '\n';
    }
    return this;
  }

  /**
   * إضافة نص QR Code (للاختبار)
   */
  addQRCode(text) {
    this.addLine(`QR: ${text}`, 'center');
    return this;
  }

  /**
   * الحصول على محتوى الإيصال كـ نص
   */
  getText() {
    return this.content;
  }

  /**
   * إعادة تعيين المحتوى
   */
  clear() {
    this.content = '';
    return this;
  }

  /**
   * طباعة على الطابعة الحرارية (عبر Web USB)
   */
  async printThermal() {
    try {
      // التحقق من دعم Web USB
      if (!navigator.usb) {
        throw new Error('المتصفح لا يدعم Web USB');
      }

      const device = await navigator.usb.requestDevice({ filters: [] });
      await device.open();
      await device.selectConfiguration(1);
      await device.claimInterface(0);

      const data = this._prepareForThermalPrinter(this.content);
      await device.transferOut(1, data);

      await device.close();
      return { success: true, message: 'تمت الطباعة بنجاح' };
    } catch (error) {
      console.error('خطأ في الطباعة الحرارية:', error);
      return { 
        success: false, 
        message: error.message || 'فشلت الطباعة الحرارية',
        suggestion: 'استخدم "طباعة عادية" أو تأكد من توصيل الطابعة'
      };
    }
  }

  /**
   * طباعة عادية (Browser Print Dialog)
   */
  printBrowser() {
    const printWindow = window.open('', '', 'width=400,height=600');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>إيصال</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            direction: rtl;
            width: 80mm;
            margin: 0;
            padding: 0;
            background: white;
          }
          pre {
            font-size: 10pt;
            line-height: 1.2;
            margin: 0;
            padding: 10mm;
            font-family: 'Courier New', monospace;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          @media print {
            body { margin: 0; padding: 0; }
            pre { padding: 0; }
          }
        </style>
      </head>
      <body>
        <pre>${this._escapeHtml(this.content)}</pre>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  /**
   * تحضير البيانات لـ ESC/POS (الطابعات الحرارية)
   */
  _prepareForThermalPrinter(text) {
    const arr = [];
    
    // ESC/POS commands
    arr.push(0x1B, 0x40); // ESC @ - Initialize printer
    arr.push(0x1B, 0x61, 0x01); // ESC a n - Center alignment
    
    // Convert text to bytes (UTF-8)
    const encoder = new TextEncoder();
    const textBytes = encoder.encode(text);
    for (let i = 0; i < textBytes.length; i++) {
      arr.push(textBytes[i]);
    }
    
    // ESC/POS - Cut paper
    arr.push(0x1D, 0x56, 0x41, 0x03); // GS V m n - Full cut
    arr.push(0x0A); // LF - Line feed
    
    return new Uint8Array(arr);
  }

  /**
   * دالة مساعدة - تكرار نص
   */
  _repeat(text, count) {
    return text.repeat(Math.max(0, count));
  }

  /**
   * دالة مساعدة - تنسيق السطر حسب المحاذاة
   */
  _formatLine(text, align = 'right') {
    const textStr = String(text || '');
    
    if (align === 'center') {
      const padding = Math.max(0, Math.floor((this.charWidth - textStr.length) / 2));
      return this._repeat(' ', padding) + textStr;
    } else if (align === 'left') {
      return textStr.padEnd(this.charWidth);
    }
    // right (default)
    return textStr.padStart(this.charWidth);
  }

  /**
   * دالة مساعدة - Escape HTML
   */
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

/**
 * دالة مساعدة - إنشاء إيصال من بيانات الطلب
 */
function createReceiptPrinter(order, items, discount = 0, width = 80) {
  const printer = new ThermalPrinter(width);
  const total = parseFloat(order.Total_Amount);
  const finalTotal = total - (discount || 0);
  
  // Header
  printer.addTitle('Foodna Shop');
  printer.addLine('نقاط البيع', 'center');
  printer.addBlankLines();
  
  // Order Info
  printer.addLine(`رقم الطلب: #${order.Order_ID}`);
  const date = new Date(order.Created_At).toLocaleString('ar-EG', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
  printer.addLine(`التاريخ: ${date}`);
  printer.addLine(`الدفع: ${order.Payment_Method === 'cash' ? 'نقدي' : 'بطاقة'}`);
  printer.addBlankLines();
  
  // Items Header
  printer.addSeparator();
  printer.addRowThree('المنتج', 'السعر', 'الكمية');
  printer.addSeparator();
  
  // Items
  if (Array.isArray(items) && items.length > 0) {
    items.forEach(item => {
      const itemTotal = (item.Quantity * parseFloat(item.Price)).toFixed(2);
      printer.addLine(item.Product_Name || 'منتج');
      printer.addRowThree(
        `${itemTotal} جنيه`,
        `${parseFloat(item.Price).toFixed(2)} جنيه`,
        `${item.Quantity} وحدة`
      );
    });
  }
  
  // Total Section
  printer.addBlankLines();
  printer.addSeparator();
  printer.addRow('المجموع الفرعي:', `${total.toFixed(2)} جنيه`);
  
  if (discount && discount > 0) {
    printer.addRow('الخصم:', `-${parseFloat(discount).toFixed(2)} جنيه`);
  }
  
  printer.addBlankLines();
  printer.addRow('الإجمالي:', `${finalTotal.toFixed(2)} جنيه`, ' ');
  printer.addSeparator();
  
  // Footer
  printer.addBlankLines();
  printer.addLine('شكراً لزيارتك!', 'center');
  printer.addLine(`Foodna Shop © ${new Date().getFullYear()}`, 'center');
  printer.addBlankLines(3);
  
  return printer;
}

/**
 * دالة سريعة للطباعة الفورية
 */
async function quickPrint(order, items, discount = 0, method = 'browser') {
  const printer = createReceiptPrinter(order, items, discount);
  
  if (method === 'thermal') {
    return await printer.printThermal();
  } else {
    printer.printBrowser();
    return { success: true, message: 'فتحت نافذة الطباعة' };
  }
}
