import api from './api'

/* Descarga de reportes: el endpoint exige el JWT en el header, así que no
   sirve un <a href>; se pide como blob y se guarda con su nombre. */
export const descargarCsv = async (ruta: string, nombre: string, params: Record<string, string> = {}) => {
  const res = await api.get(ruta, { params, responseType: 'blob' })
  const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = nombre
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
