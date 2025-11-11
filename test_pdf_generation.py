#!/usr/bin/env python3
"""
Script para testar a geração de PDF com diferentes bibliotecas
"""

import os
import tempfile

def test_weasyprint():
    """Testa se WeasyPrint está funcionando"""
    try:
        import weasyprint
        print("✅ WeasyPrint importado com sucesso")
        
        # Teste básico de geração de PDF
        html_content = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Teste PDF</title>
        </head>
        <body>
            <h1>Teste de Geração de PDF</h1>
            <p>Este é um teste do WeasyPrint.</p>
        </body>
        </html>
        """
        
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp_file:
            pdf_path = tmp_file.name
        
        weasyprint.HTML(string=html_content).write_pdf(pdf_path)
        
        if os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 0:
            print(f"✅ PDF gerado com sucesso: {pdf_path}")
            os.unlink(pdf_path)  # Remove o arquivo de teste
            return True
        else:
            print("❌ PDF não foi gerado corretamente")
            return False
            
    except ImportError as e:
        print(f"❌ WeasyPrint não está disponível: {e}")
        return False
    except Exception as e:
        print(f"❌ Erro ao testar WeasyPrint: {e}")
        return False

def test_pdfkit():
    """Testa se pdfkit está funcionando"""
    try:
        import pdfkit
        print("✅ pdfkit importado com sucesso")
        
        # Teste básico de geração de PDF
        html_content = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Teste PDF</title>
        </head>
        <body>
            <h1>Teste de Geração de PDF</h1>
            <p>Este é um teste do pdfkit.</p>
        </body>
        </html>
        """
        
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp_file:
            pdf_path = tmp_file.name
        
        options = {
            'page-size': 'A4',
            'margin-top': '0.75in',
            'margin-right': '0.75in',
            'margin-bottom': '0.75in',
            'margin-left': '0.75in',
            'encoding': "UTF-8",
            'no-outline': None
        }
        
        pdfkit.from_string(html_content, pdf_path, options=options)
        
        if os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 0:
            print(f"✅ PDF gerado com sucesso: {pdf_path}")
            os.unlink(pdf_path)  # Remove o arquivo de teste
            return True
        else:
            print("❌ PDF não foi gerado corretamente")
            return False
            
    except ImportError as e:
        print(f"❌ pdfkit não está disponível: {e}")
        return False
    except Exception as e:
        print(f"❌ Erro ao testar pdfkit: {e}")
        return False

def main():
    print("🧪 Testando bibliotecas de geração de PDF...")
    print("=" * 50)
    
    weasyprint_ok = test_weasyprint()
    print()
    pdfkit_ok = test_pdfkit()
    
    print("\n" + "=" * 50)
    print("📊 Resumo dos testes:")
    print(f"WeasyPrint: {'✅ Funcionando' if weasyprint_ok else '❌ Não funcionando'}")
    print(f"pdfkit: {'✅ Funcionando' if pdfkit_ok else '❌ Não funcionando'}")
    
    if weasyprint_ok:
        print("\n🎉 Recomendação: Use WeasyPrint (mais confiável)")
    elif pdfkit_ok:
        print("\n⚠️ Recomendação: Use pdfkit (mas pode ter problemas com wkhtmltopdf)")
    else:
        print("\n❌ Nenhuma biblioteca de PDF está funcionando!")
        print("💡 Instale WeasyPrint: pip install weasyprint")

if __name__ == "__main__":
    main()
