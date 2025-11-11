# Configuração do pdfkit para wkhtmltopdf
import pdfkit

# Configuração do wkhtmltopdf
WKHTMLTOPDF_PATH = r"C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe"
pdfkit_config = pdfkit.configuration(wkhtmltopdf=WKHTMLTOPDF_PATH)

# Função para gerar PDF
def generate_pdf(html_content, output_path):
    return pdfkit.from_string(html_content, output_path, configuration=pdfkit_config)
