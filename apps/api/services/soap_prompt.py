"""Construção do prompt de geração de SOAP a partir do transcript diarizado.

Separa a engenharia de prompt da lógica de orquestração (services/soap.py).
build_prompt() devolve (prompt, system) prontos para llm_client.call_llm.
"""

SYSTEM_PROMPT = (
    "Você é um assistente médico especializado em documentação clínica brasileira. "
    "Gere SOMENTE JSON válido, sem texto extra, sem markdown, sem comentários. "
    "Siga o formato SOAP exigido pela CFM Resolução 1.638/2002. "
    "Use terminologia médica brasileira. Nunca invente dados que não estejam na "
    "transcrição. Você NÃO prescreve nem solicita exames — apenas documenta o que "
    "o médico disse e registrou na consulta."
)

# Exemplo few-shot para ancorar formato e terminologia.
_FEWSHOT_TRANSCRIPT = (
    "[MÉDICO]: Bom dia, em que posso ajudar?\n"
    "[PACIENTE]: Estou com queimação no estômago há uma semana, principalmente após comer.\n"
    "[MÉDICO]: A dor piora deitado ou à noite?\n"
    "[PACIENTE]: Sim, piora quando deito. Sinto um gosto amargo na boca.\n"
    "[MÉDICO]: Faz uso de algum medicamento? Toma café ou bebida alcoólica?\n"
    "[PACIENTE]: Tomo bastante café e às vezes anti-inflamatório pra dor nas costas.\n"
    "[MÉDICO]: Abdome flácido, dor à palpação em epigástrio, sem sinais de irritação. "
    "Quadro compatível com doença do refluxo gastroesofágico. Vou orientar mudanças "
    "alimentares e iniciar omeprazol. Retorne em 30 dias."
)

_FEWSHOT_OUTPUT = (
    '{\n'
    '  "subjetivo": "Paciente relata queimação epigástrica há uma semana, com piora '
    'após alimentação e ao deitar, associada a regurgitação ácida (gosto amargo). '
    'Refere uso frequente de café e anti-inflamatórios.",\n'
    '  "objetivo": "Abdome flácido, doloroso à palpação em epigástrio, sem sinais de '
    'irritação peritoneal.",\n'
    '  "avaliacao": "Quadro clínico compatível com doença do refluxo gastroesofágico, '
    'possivelmente agravada por uso de AINEs e cafeína.",\n'
    '  "plano": "Orientação de mudanças alimentares e estilo de vida. Início de '
    'omeprazol. Retorno em 30 dias para reavaliação.",\n'
    '  "cid": "K21.9",\n'
    '  "hipoteses_diagnosticas": ["Doença do refluxo gastroesofágico", "Gastrite"]\n'
    '}'
)


def build_prompt(transcript: str) -> tuple[str, str]:
    """Monta (prompt, system) para gerar o SOAP da consulta.

    transcript: texto diarizado com falas marcadas por [MÉDICO] e [PACIENTE].
    """
    prompt = (
        "Gere o prontuário SOAP a partir da transcrição da consulta abaixo.\n\n"
        "Regras de extração:\n"
        "- S (subjetivo): queixas e relato do PACIENTE (sintomas, história, hábitos).\n"
        "- O (objetivo): achados e dados do exame relatados pelo MÉDICO (sinais, "
        "pressão, palpação, exame físico).\n"
        "- A (avaliação): raciocínio clínico e impressão diagnóstica do médico.\n"
        "- P (plano): conduta, prescrições e orientações ditas pelo médico.\n"
        "- cid: código CID-10 mais provável no formato \"X00.0\" (ou null se não houver "
        "base suficiente).\n"
        "- hipoteses_diagnosticas: no MÁXIMO 3, em ordem de probabilidade.\n\n"
        "Responda SOMENTE com um objeto JSON contendo exatamente as chaves: "
        "subjetivo, objetivo, avaliacao, plano, cid, hipoteses_diagnosticas.\n\n"
        "### Exemplo\n"
        "Transcrição:\n"
        f"{_FEWSHOT_TRANSCRIPT}\n\n"
        "JSON:\n"
        f"{_FEWSHOT_OUTPUT}\n\n"
        "### Agora gere para esta consulta\n"
        "Transcrição:\n"
        f"{transcript}\n\n"
        "JSON:"
    )
    return prompt, SYSTEM_PROMPT
