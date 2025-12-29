async function removeBackground() {
    if (!imageInput.files[0]) return notify('❌ اختر صورة أولاً', 'error');
    setBtnState('#removeBgBtn', true);

    const reader = new FileReader();
    reader.onload = async (e) => {
        const base64Image = e.target.result.split(',')[1]; // إزالة "data:image/png;base64,"

        try {
            const res = await fetch('/.netlify/functions/removeBg', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64Image })
            });

            const data = await res.json();
            if (res.ok) {
                output.src = `data:image/png;base64,${data.image}`;
                notify('🪄 تمت إزالة الخلفية بنجاح');
            } else {
                notify(`❌ خطأ: ${data.error}`, 'error');
            }
        } catch (err) {
            notify('❌ فشل الاتصال بالخادم', 'error');
        } finally {
            setBtnState('#removeBgBtn', false, ' إزالة الخلفية', 'fas fa-magic');
        }
    };

    reader.readAsDataURL(imageInput.files[0]);
}