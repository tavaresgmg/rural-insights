from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import time
import logging
from typing import Optional

from services.csv_processor import CSVProcessor
from schemas.analysis import UploadResponse, ErrorResponse, AnalysisResponse

router = APIRouter()
logger = logging.getLogger(__name__)

# Configurações
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'.csv'}


@router.post("/", response_model=UploadResponse)
async def upload_csv(file: UploadFile = File(...)):
    """
    Endpoint para upload e processamento de arquivo CSV
    
    - Aceita apenas arquivos CSV
    - Tamanho máximo: 10MB
    - Retorna análise completa dos dados
    """
    start_time = time.time()
    
    # Validação do arquivo
    if not file.filename:
        raise HTTPException(status_code=400, detail="Arquivo sem nome")
    
    # Verifica extensão
    file_extension = '.' + file.filename.split('.')[-1].lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Tipo de arquivo não permitido. Use: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Lê conteúdo do arquivo
    try:
        contents = await file.read()
        
        # Verifica tamanho
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"Arquivo muito grande. Máximo: {MAX_FILE_SIZE / 1024 / 1024}MB"
            )
        
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Arquivo vazio")
            
    except Exception as e:
        logger.error(f"Erro ao ler arquivo: {e}")
        raise HTTPException(status_code=400, detail="Erro ao ler arquivo")
    
    # Processa o CSV
    try:
        processor = CSVProcessor()
        analysis = await processor.process_csv(contents)
        
        processing_time = time.time() - start_time
        
        return UploadResponse(
            success=True,
            message="Arquivo processado com sucesso",
            analysis=analysis,
            processing_time=round(processing_time, 2)
        )
        
    except ValueError as e:
        logger.warning(f"Erro de validação: {e}")
        return JSONResponse(
            status_code=400,
            content=ErrorResponse(
                error="Erro de validação",
                detail=str(e),
                suggestion="Verifique se o arquivo está no formato correto"
            ).model_dump()
        )
    except Exception as e:
        logger.error(f"Erro ao processar CSV: {e}")
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(
                error="Erro ao processar arquivo",
                detail="Ocorreu um erro inesperado",
                suggestion="Tente novamente ou contate o suporte"
            ).model_dump()
        )


@router.get("/sample")
async def get_sample_format():
    """Retorna exemplo do formato esperado do CSV"""
    return {
        "format": "CSV com ponto-e-vírgula (;) como delimitador",
        "encoding": "UTF-8, ISO-8859-1 ou Latin-1",
        "required_columns": [
            "descricao",
            "valor", 
            "data",
            "operacao",
            "realizado"
        ],
        "example": {
            "descricao": "COMBUSTÍVEL",
            "valor": "-150.00",
            "data": "15/01/2024",
            "operacao": "SAÍDA",
            "realizado": "SIM"
        },
        "notes": [
            "Valores de saída podem ser negativos ou positivos",
            "Data no formato DD/MM/AAAA",
            "Operação deve ser 'SAÍDA' ou 'ENTRADA'",
            "Realizado deve ser 'SIM' ou 'NÃO'"
        ]
    }