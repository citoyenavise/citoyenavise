// Gestionnaire de Versioning - Phase 1

const Conventions = require('../conventions/Conventions');
const Logger = require('../logging/Logger');

class VersionManager {
  constructor(config = {}) {
    this.logger = new Logger('VersionManager');
    this.systemVersion = config.systemVersion || '1.0.0';
    this.moduleVersions = new Map();
    this.compatibilityMatrix = new Map();
    this.versionHistory = [];
  }

  // Initialiser le gestionnaire de versioning
  initialize() {
    this.logger.info('Initialisation du gestionnaire de versioning', {
      systemVersion: this.systemVersion,
    });

    this.versionHistory.push({
      version: this.systemVersion,
      timestamp: new Date(),
      event: 'INIT',
    });
  }

  // Enregistrer la version d'un module
  registerModuleVersion(moduleId, version) {
    if (!Conventions.validateVersion(version)) {
      throw new Error(`Version invalide pour ${moduleId}: ${version}`);
    }

    this.moduleVersions.set(moduleId, version);
    this.logger.debug(`Version enregistrée: ${moduleId}@${version}`);
  }

  // Vérifier la compatibilité entre versions
  checkCompatibility(moduleId, requiredVersion, installedVersion) {
    const installed = this.parseVersion(installedVersion);
    const required = this.parseVersion(requiredVersion);

    // Vérifier la compatibilité
    if (installed.major !== required.major) {
      return {
        compatible: false,
        reason: 'Versions majeures incompatibles',
        installed: installedVersion,
        required: requiredVersion,
      };
    }

    if (installed.minor < required.minor) {
      return {
        compatible: false,
        reason: 'Version mineure insuffisante',
        installed: installedVersion,
        required: requiredVersion,
      };
    }

    return {
      compatible: true,
      installed: installedVersion,
      required: requiredVersion,
    };
  }

  // Parser une version SEMVER
  parseVersion(version) {
    const [mainPart, prerelease] = version.split('-');
    const [major, minor, patch] = mainPart.split('.').map(Number);

    return {
      version,
      major,
      minor,
      patch,
      prerelease: prerelease || null,
    };
  }

  // Comparer deux versions
  compareVersions(v1, v2) {
    const parsed1 = this.parseVersion(v1);
    const parsed2 = this.parseVersion(v2);

    if (parsed1.major !== parsed2.major) {
      return parsed1.major > parsed2.major ? 1 : -1;
    }

    if (parsed1.minor !== parsed2.minor) {
      return parsed1.minor > parsed2.minor ? 1 : -1;
    }

    if (parsed1.patch !== parsed2.patch) {
      return parsed1.patch > parsed2.patch ? 1 : -1;
    }

    return 0;
  }

  // Obtenir la version d'un module
  getModuleVersion(moduleId) {
    return this.moduleVersions.get(moduleId);
  }

  // Obtenir la version du système
  getSystemVersion() {
    return this.systemVersion;
  }

  // Vérifier la compatibilité de tous les modules
  checkAllCompatibilities(requiredVersions = {}) {
    const results = {};

    for (const [moduleId, requiredVersion] of Object.entries(requiredVersions)) {
      const installedVersion = this.getModuleVersion(moduleId);

      if (!installedVersion) {
        results[moduleId] = {
          compatible: false,
          reason: 'Module non enregistré',
        };
      } else {
        results[moduleId] = this.checkCompatibility(moduleId, requiredVersion, installedVersion);
      }
    }

    return results;
  }

  // Obtenir l'historique des versions
  getVersionHistory() {
    return [...this.versionHistory];
  }

  // Mettre à jour la version du système
  updateSystemVersion(newVersion) {
    if (!Conventions.validateVersion(newVersion)) {
      throw new Error(`Version système invalide: ${newVersion}`);
    }

    const oldVersion = this.systemVersion;
    this.systemVersion = newVersion;

    this.versionHistory.push({
      version: newVersion,
      previousVersion: oldVersion,
      timestamp: new Date(),
      event: 'SYSTEM_UPDATE',
    });

    this.logger.info(`Version système mise à jour: ${oldVersion} -> ${newVersion}`);
  }

  // Obtenir les informations de versioning
  getInfo() {
    return {
      systemVersion: this.systemVersion,
      moduleVersions: Object.fromEntries(this.moduleVersions),
      history: this.versionHistory,
    };
  }
}

module.exports = VersionManager;
