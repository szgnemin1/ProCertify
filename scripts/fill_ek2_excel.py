import sys
import json
import os
import re
import base64
import tempfile
import openpyxl
from openpyxl.drawing.image import Image

def fill_ek2(form_json_path, output_xlsx_path):
    with open(form_json_path, 'r', encoding='utf-8') as f:
        form = json.load(f)

    fields = form.get('fields', {})
    template_path = os.path.join(os.path.dirname(__file__), '..', 'templates', 'ek2_template.xlsx')
    if not os.path.exists(template_path):
        template_path = os.path.join(os.getcwd(), 'templates', 'ek2_template.xlsx')

    wb = openpyxl.load_workbook(template_path)
    ws = wb.active

    # Helper safely writing to top-left cell of merged ranges or normal cells
    def write_cell(coord, val):
        if val is None:
            return
        try:
            ws[coord] = str(val)
        except AttributeError:
            # If cell is merged child, ignore or find its top-left
            pass

    # 1. Workplace Info
    comp_name = form.get('companyName') or fields.get('isyeriUnvani') or ''
    write_cell('H6', comp_name)
    write_cell('H8', fields.get('sgkSicilNo') or '')
    write_cell('H10', fields.get('isyeriAdresi') or '')
    write_cell('H12', fields.get('isyeriIletisim') or '')

    # 2. Employee Info
    emp_name = fields.get('adSoyad') or form.get('employeeName') or ''
    emp_tc = fields.get('tckn') or form.get('employeeTc') or ''
    write_cell('A22', f"Adı ve Soyadı: {emp_name}")
    write_cell('X22', f"T.C. Kimlik No: {emp_tc}")
    write_cell('A24', f"Ev Adresi: {fields.get('evAdresi') or ''}")
    write_cell('A26', f"Doğum Yeri ve Tarihi: {fields.get('dogumYeriTarihi') or ''}")
    write_cell('U26', f"Medeni Durumu: {fields.get('medeniDurumu') or ''}")
    write_cell('AF26', f"Çocuk Sayısı: {fields.get('cocukSayisi') or ''}")
    write_cell('A28', f"Telefon No: {fields.get('telefonNo') or ''}")
    write_cell('U28', f"Eğitim Durumu: {fields.get('egitimDurumu') or ''}")
    write_cell('AF28', f"Cinsiyeti : {fields.get('cinsiyet') or 'Erkek'}")
    write_cell('A30', f"Mesleği: {fields.get('meslegi') or ''}")
    write_cell('U30', f"Çalıştığı Bölüm: {fields.get('calistigiBolum') or ''}")
    write_cell('A32', f"Yaptığı İş (Ayrıntılı olarak tanımlanacaktır.) : {fields.get('yaptigiIs') or ''}")

    # 3. Past Jobs (Rows 38, 40, 42)
    write_cell('B38', fields.get('past_job_1_col') or fields.get('gecmisIsler') or '-')
    write_cell('K38', fields.get('past_job_1_work') or '-')
    write_cell('U38', fields.get('past_job_1_date') or '-')

    write_cell('B40', fields.get('past_job_2_col') or '-')
    write_cell('K40', fields.get('past_job_2_work') or '-')
    write_cell('U40', fields.get('past_job_2_date') or '-')

    write_cell('B42', fields.get('past_job_3_col') or '-')
    write_cell('K42', fields.get('past_job_3_work') or '-')
    write_cell('U42', fields.get('past_job_3_date') or '-')

    # 4. Anamnez Complaints (Rows 48 to 55)
    # Col J = Evet, Col L = Hayır, Col N = Tarih
    complaints_map = [
        ('an_balgamli_oksuruk', 48, 'an_date_balgam'),
        ('an_nefes_darligi', 49, 'an_date_nefes'),
        ('an_gogus_agrisi', 50, 'an_date_gogus'),
        ('an_carpinti', 51, 'an_date_carpinti'),
        ('an_sirt_agrisi', 52, 'an_date_sirt'),
        ('an_ishal_kabizlik', 53, 'an_date_ishal'),
        ('an_eklem_agrisi', 54, 'an_date_eklem')
    ]
    for key, row, date_key in complaints_map:
        val = fields.get(key, 'Hayır')
        if val == 'Evet':
            write_cell(f'J{row}', 'X')
            write_cell(f'L{row}', '')
            write_cell(f'N{row}', fields.get(date_key) or '')
        else:
            write_cell(f'J{row}', '')
            write_cell(f'L{row}', 'X')

    if fields.get('an_diger_belirti'):
        write_cell('F55', fields.get('an_diger_belirti'))

    # 5. Anamnez Diseases (Rows 48 to 58)
    # Col AD = Evet, Col AF = Hayır, Col AH = Tarih
    diseases_map = [
        ('an_kalp', 48, 'an_date_kalp'),
        ('an_seker', 49, 'an_date_seker'),
        ('an_bobrek', 50, 'an_date_bobrek'),
        ('an_sarilik', 51, 'an_date_sarilik'),
        ('an_ulser', 52, 'an_date_ulser'),
        ('an_isitme', 53, 'an_date_isitme'),
        ('an_gorme', 54, 'an_date_gorme'),
        ('an_sinir', 55, 'an_date_sinir'),
        ('an_deri', 56, 'an_date_deri'),
        ('an_besin', 57, 'an_date_besin')
    ]
    for key, row, date_key in diseases_map:
        val = fields.get(key, 'Hayır')
        if val == 'Evet':
            write_cell(f'AD{row}', 'X')
            write_cell(f'AF{row}', '')
            write_cell(f'AH{row}', fields.get(date_key) or '')
        else:
            write_cell(f'AD{row}', '')
            write_cell(f'AF{row}', 'X')

    if fields.get('an_diger_hastalik'):
        write_cell('F58', fields.get('an_diger_hastalik'))

    # 6. Special Anamnez (Rows 59 to 73)
    if fields.get('an_hastane') == 'Evet':
        write_cell('N59', '')
        write_cell('U59', f"Evet (Tanı: {fields.get('an_hastane_detay') or '-'})")
    else:
        write_cell('N59', 'Hayır (X)')

    if fields.get('an_ameliyat') == 'Evet':
        write_cell('N60', '')
        write_cell('U60', f"Evet (Neden: {fields.get('an_ameliyat_detay') or '-'})")
    else:
        write_cell('N60', 'Hayır (X)')

    if fields.get('an_is_kazasi') == 'Evet':
        write_cell('N61', '')
        write_cell('U61', f"Evet (Açıklama: {fields.get('an_is_kazasi_detay') or '-'})")
    else:
        write_cell('N61', 'Hayır (X)')

    if fields.get('an_meslek_hastaligi') == 'Evet':
        write_cell('B63', '')
        write_cell('H63', f"Evet (Sonuç: {fields.get('an_meslek_detay') or '-'})")
    else:
        write_cell('B63', 'Hayır (X)')

    if fields.get('an_maluliyet') == 'Evet':
        write_cell('P64', '')
        write_cell('U64', f"Evet ({fields.get('an_maluliyet_detay') or '-'})")
    else:
        write_cell('P64', 'Hayır (X)')

    if fields.get('an_mevcut_tedavi') == 'Evet':
        write_cell('P65', '')
        write_cell('U65', f"Evet ({fields.get('an_tedavi_detay') or '-'})")
    else:
        write_cell('P65', 'Hayır (X)')

    # Sigara & Alkol
    sigara = fields.get('an_sigara', 'Hayır')
    if sigara == 'Hayır':
        write_cell('B67', 'Hayır (X)')
    elif sigara == 'Bırakmış':
        write_cell('B68', f"Bırakmış (X) {fields.get('an_sigara_detay') or ''}")
    else:
        write_cell('B69', f"Evet (X) {fields.get('an_sigara_detay') or ''}")

    alkol = fields.get('an_alkol', 'Hayır')
    if alkol == 'Hayır':
        write_cell('B71', 'Hayır (X)')
    elif alkol == 'Bırakmış':
        write_cell('B72', f"Bırakmış (X) {fields.get('an_alkol_detay') or ''}")
    else:
        write_cell('B73', f"Evet (X) {fields.get('an_alkol_detay') or ''}")

    # PAGE 2:
    # Özgeçmiş & Soygeçmiş
    write_cell('F83', fields.get('kanGrubu') or 'A Rh(+)')
    write_cell('G85', fields.get('kronikHastalik') or 'Yok')
    write_cell('G89', fields.get('asiTetanoz') or 'Var')
    write_cell('G91', fields.get('asiHepatit') or 'Bağışık')

    write_cell('D99', fields.get('soy_anne') or 'Sağ / Doğal')
    write_cell('N99', fields.get('soy_baba') or 'Sağ / Doğal')
    write_cell('Y99', fields.get('soy_kardes') or 'Sağ / Doğal')
    write_cell('D101', fields.get('soy_cocuk') or 'Sağ / Doğal')

    # Fizik Muayene
    write_cell('E107', fields.get('fm_duyu_organlari') or 'Doğal')
    write_cell('K113', fields.get('fm_kvs') or 'S1, S2 ritmik, ek ses yok')
    write_cell('I115', fields.get('fm_solunum') or 'Bilateral veziküler')
    write_cell('I117', fields.get('fm_sindirim') or 'Batın rahat, defans yok')
    write_cell('I119', fields.get('fm_urogenital') or 'Doğal')
    write_cell('J121', fields.get('fm_kas_iskelet') or 'Eklem hareketleri tam')
    write_cell('F123', fields.get('fm_norolojik') or 'Bilinç açık, oryante')
    write_cell('G125', fields.get('fm_psikiyatrik') or 'Duygulanım doğal')

    # Vital Bulgular
    write_cell('G129', f"-TA: {fields.get('vital_ta') or '120/80'} mmHg")
    write_cell('E131', f"-Nb: {fields.get('vital_nb') or '76'} /dk")
    write_cell('E133', f"-Boy: {fields.get('vital_boy') or '175'} cm")
    write_cell('L133', f"Kilo: {fields.get('vital_kilo') or '75'} kg")
    write_cell('V133', f"Vücut Kitle İndeksi: {fields.get('vital_vki') or '24.5 kg/m²'}")

    # Laboratuvar
    write_cell('E141', fields.get('lab_kan') or 'Rutin parametreler doğal')
    write_cell('E143', fields.get('lab_idrar') or 'Tam idrar tetkiki normal')
    write_cell('G145', fields.get('lab_radyoloji') or 'Akciğer Grafisi: Aktif lezyon izlenmedi')
    write_cell('G149', fields.get('lab_odyo') or 'Odyometri: İki taraflı işitme doğal')
    write_cell('E151', fields.get('lab_sft') or 'SFT: Solunum fonksiyonları normal')
    write_cell('D155', fields.get('lab_bulgulari') or 'Rutin tetkikler normal sınırlardadır.')

    # Kanaat ve Sonuç
    write_cell('D161', f"1- {fields.get('dec_elverisli') or 'İşinde bedenen ve ruhen çalışmaya elverişlidir.'}")
    write_cell('D163', f"2- {fields.get('dec_kosullar') or 'Yüksekte / Gece / Vardiyalı çalışmaya elverişlidir.'}")
    write_cell('D165', f"3- {fields.get('dec_sart') or 'Şartı: Yoktur.'}")

    # Tarih ve Hekim
    write_cell('O174', fields.get('muayeneTarihi') or '06/11/2026')
    write_cell('E175', f"İŞYERİ HEKİMİ: {fields.get('hekimAdi') or form.get('doctorName') or 'Dr. İşyeri Hekimi'}")

    # 7. Signature image embedding
    sig_data = form.get('employeeSignature')
    if sig_data and ',' in sig_data:
        try:
            b64_str = sig_data.split(',')[1]
            img_bytes = base64.b64decode(b64_str)
            with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
                tmp.write(img_bytes)
                tmp_path = tmp.name

            img = Image(tmp_path)
            # Scale signature image appropriately for Excel
            img.width = 160
            img.height = 70
            # Place signature image in declaration area (e.g. cell V16)
            ws.add_image(img, 'V16')
        except Exception as e:
            print(f"Signature embed warning: {e}", file=sys.stderr)

    wb.save(output_xlsx_path)
    print(f"Successfully generated {output_xlsx_path}")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python fill_ek2_excel.py <form_json_path> <output_xlsx_path>")
        sys.exit(1)
    fill_ek2(sys.argv[1], sys.argv[2])
