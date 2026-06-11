"""Construção do prompt de sugestão de exames a partir do SOAP confirmado.

Entrada: SOAPContent (especialmente hipoteses_diagnosticas e avaliacao).
Saída do LLM: JSON { "sugestoes": [ {exam_name, category, justification,
hypothesis_ref, priority} ] }. build_prompt() devolve (prompt, system).
"""
from schemas.soap import SOAPContent

SYSTEM_PROMPT = (
    "Você é um assistente médico brasileiro especializado em apoio à decisão "
    "clínica. Sugere exames complementares pertinentes às hipóteses diagnósticas, "
    "usando nomenclatura brasileira. Retorna SOMENTE JSON válido, sem texto extra, "
    "sem markdown. Você NÃO prescreve medicamentos e NÃO solicita exames — apenas "
    "sugere, de forma assistiva, para o médico decidir. As sugestões são opcionais."
)

_FEWSHOT_INPUT = (
    "Avaliação: Paciente com fadiga, palidez cutânea e relato de menstruação "
    "volumosa. Suspeita de anemia.\n"
    "Hipóteses diagnósticas: Anemia ferropriva, Sangramento uterino anormal"
)

_FEWSHOT_OUTPUT = (
    '{\n'
    '  "sugestoes": [\n'
    '    {\n'
    '      "exam_name": "Hemograma completo",\n'
    '      "category": "laboratorial",\n'
    '      "justification": "Avalia série vermelha e confirma anemia, quantificando '
    'gravidade.",\n'
    '      "hypothesis_ref": "Anemia ferropriva",\n'
    '      "priority": "alta"\n'
    '    },\n'
    '    {\n'
    '      "exam_name": "Ferritina sérica",\n'
    '      "category": "laboratorial",\n'
    '      "justification": "Avalia estoques de ferro para diferenciar anemia '
    'ferropriva de outras causas.",\n'
    '      "hypothesis_ref": "Anemia ferropriva",\n'
    '      "priority": "alta"\n'
    '    },\n'
    '    {\n'
    '      "exam_name": "Ultrassonografia transvaginal",\n'
    '      "category": "imagem",\n'
    '      "justification": "Investiga causas estruturais de sangramento uterino '
    'anormal.",\n'
    '      "hypothesis_ref": "Sangramento uterino anormal",\n'
    '      "priority": "media"\n'
    '    }\n'
    '  ]\n'
    '}'
)


def build_prompt(soap: SOAPContent) -> tuple[str, str]:
    hipoteses = "; ".join(soap.hipoteses_diagnosticas) if soap.hipoteses_diagnosticas else "Não especificadas"
    prompt = (
        "Sugira exames complementares pertinentes às hipóteses diagnósticas da "
        "consulta, com base no SOAP confirmado abaixo.\n\n"
        "Regras:\n"
        "- No MÁXIMO 8 sugestões.\n"
        "- Cada sugestão deve estar vinculada a UMA hipótese específica via "
        "'hypothesis_ref' (use exatamente o texto de uma das hipóteses).\n"
        "- category ∈ {laboratorial, imagem, funcional, outro}.\n"
        "- priority ∈ {alta, media, baixa}.\n"
        "- Nomenclatura de exames brasileira. NÃO sugira medicamentos.\n"
        "- justification: 1 frase clínica objetiva.\n\n"
        "Responda SOMENTE com JSON no formato: "
        '{ "sugestoes": [ { "exam_name", "category", "justification", '
        '"hypothesis_ref", "priority" } ] }.\n\n'
        "### Exemplo\n"
        f"{_FEWSHOT_INPUT}\n\n"
        "JSON:\n"
        f"{_FEWSHOT_OUTPUT}\n\n"
        "### Agora gere para esta consulta\n"
        f"Avaliação: {soap.avaliacao}\n"
        f"Plano: {soap.plano}\n"
        f"Hipóteses diagnósticas: {hipoteses}\n\n"
        "JSON:"
    )
    return prompt, SYSTEM_PROMPT
