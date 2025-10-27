import TuyenDuongModel from "../models/TuyenDuongModel.js";
import DiemDungModel from "../models/DiemDungModel.js";

class RouteService {
  static async list(options = {}) {
    const { page = 1, limit = 10 } = options;
    const data = await TuyenDuongModel.getAll(options);
    const total = await TuyenDuongModel.count(options);
    return {
      data,
      pagination: {
        page: +page,
        limit: +limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getById(id) {
    const route = await TuyenDuongModel.getById(id);
    if (!route) throw new Error("ROUTE_NOT_FOUND");
    route.diemDung = await DiemDungModel.getByRoute(id);
    return route;
  }

  static async create(payload) {
    if (!payload.tenTuyen) throw new Error("MISSING_REQUIRED_FIELDS");
    const id = await TuyenDuongModel.create(payload);
    return await this.getById(id);
  }

  static async update(id, data) {
    const r = await TuyenDuongModel.getById(id);
    if (!r) throw new Error("ROUTE_NOT_FOUND");
    await TuyenDuongModel.update(id, data);
    return await this.getById(id);
  }

  static async delete(id) {
    const r = await TuyenDuongModel.getById(id);
    if (!r) throw new Error("ROUTE_NOT_FOUND");
    await TuyenDuongModel.delete(id);
    return true;
  }

  static async getStops(routeId) {
    await this.getById(routeId);
    return await DiemDungModel.getByRoute(routeId);
  }

  static async createStop(payload) {
    if (
      !payload.maTuyen ||
      !payload.tenDiem ||
      payload.viDo === undefined ||
      payload.kinhDo === undefined
    )
      throw new Error("MISSING_REQUIRED_FIELDS");
    const route = await TuyenDuongModel.getById(payload.maTuyen);
    if (!route) throw new Error("ROUTE_NOT_FOUND");
    const stopId = await DiemDungModel.create(payload);
    return await DiemDungModel.getById(stopId);
  }

  static async updateStop(id, data) {
    const s = await DiemDungModel.getById(id);
    if (!s) throw new Error("STOP_NOT_FOUND");
    await DiemDungModel.update(id, data);
    return await DiemDungModel.getById(id);
  }

  static async deleteStop(id) {
    const s = await DiemDungModel.getById(id);
    if (!s) throw new Error("STOP_NOT_FOUND");
    await DiemDungModel.delete(id);
    return true;
  }

  static async reorderStops(routeId, stopIds) {
    const route = await TuyenDuongModel.getById(routeId);
    if (!route) throw new Error("ROUTE_NOT_FOUND");
    await DiemDungModel.reorder(routeId, stopIds);
    return await DiemDungModel.getByRoute(routeId);
  }
}

export default RouteService;
