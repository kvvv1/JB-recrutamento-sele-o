from weasyprint import HTML

if __name__ == "__main__":
	HTML(string="<h1>Teste PDF</h1><p>Ok!</p>").write_pdf("teste_output.pdf")
	print("PDF gerado: teste_output.pdf") 