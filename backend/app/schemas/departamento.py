from pydantic import BaseModel, ConfigDict


class DepartamentoBase(BaseModel):
    nombre: str


class DepartamentoCrear(DepartamentoBase):
    pass


class DepartamentoOut(DepartamentoBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
