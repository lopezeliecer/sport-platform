import { Controller, Get, Post, Body, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { SecurityTestingService, SecurityTestResult } from './security-testing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequireClubAdmin } from '../auth/decorators/permissions.decorator';

export class SecurityTestRequestDto {
  testTypes?: string[];
  includePerformanceTests?: boolean;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

@ApiTags('Security Testing')
@Controller('security-testing')
@UseGuards(JwtAuthGuard)
@ApiSecurity('bearer')
export class SecurityTestingController {
  private readonly logger = new Logger(SecurityTestingController.name);

  constructor(private readonly securityTestingService: SecurityTestingService) {}

  @Get('health')
  @ApiOperation({ summary: 'Security testing service health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return {
      status: 'healthy',
      service: 'security-testing',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('run-full-suite')
  @RequireClubAdmin()
  @ApiOperation({ summary: 'Run comprehensive security test suite' })
  @ApiResponse({ status: 200, description: 'Security tests completed' })
  async runFullSecurityTestSuite(): Promise<SecurityTestResult[]> {
    this.logger.log('Running full security test suite...');
    
    try {
      const results = await this.securityTestingService.runFullSecurityTestSuite();
      
      this.logger.log(`Security test suite completed: ${results.length} tests run`);
      
      return results;
    } catch (error) {
      this.logger.error('Security test suite failed', error.stack);
      throw error;
    }
  }

  @Get('report')
  @RequireClubAdmin()
  @ApiOperation({ summary: 'Get security test report' })
  @ApiResponse({ status: 200, description: 'Security test report' })
  getSecurityTestReport() {
    return this.securityTestingService.getSecurityTestReport();
  }

  @Post('test-authentication')
  @RequireClubAdmin()
  @ApiOperation({ summary: 'Test authentication security' })
  @ApiResponse({ status: 200, description: 'Authentication security test results' })
  async testAuthentication(@Body() request: { token?: string }) {
    const results = await Promise.all([
      this.securityTestingService.testAuthenticationBypass(request.token || 'invalid-token'),
      request.token ? this.securityTestingService.analyzeJWTSecurity(request.token) : null,
      this.securityTestingService.testSessionFixation(),
    ]);

    return {
      authenticationBypass: results[0],
      jwtSecurity: results[1],
      sessionSecurity: results[2],
      timestamp: new Date().toISOString(),
    };
  }

  @Post('test-authorization')
  @RequireClubAdmin()
  @ApiOperation({ summary: 'Test authorization security (RBAC)' })
  @ApiResponse({ status: 200, description: 'Authorization security test results' })
  async testAuthorization(@Body() request: { role: string; resource: string }) {
    const results = await Promise.all([
      this.securityTestingService.testRBACEnforcement(request.role, request.resource),
      this.securityTestingService.testPrivilegeEscalation(),
      this.securityTestingService.testTenantIsolation(),
    ]);

    return {
      rbacEnforcement: results[0],
      privilegeEscalation: results[1],
      tenantIsolation: results[2],
      timestamp: new Date().toISOString(),
    };
  }

  @Post('test-input-security')
  @RequireClubAdmin()
  @ApiOperation({ summary: 'Test input security (SQL injection, XSS)' })
  @ApiResponse({ status: 200, description: 'Input security test results' })
  async testInputSecurity(@Body() request: { payload: string }) {
    const results = await Promise.all([
      this.securityTestingService.testSQLInjection(request.payload),
      this.securityTestingService.testXSSPrevention(request.payload),
      this.securityTestingService.testInputSizeLimits(),
    ]);

    return {
      sqlInjection: results[0],
      xssPrevention: results[1],
      inputLimits: results[2],
      timestamp: new Date().toISOString(),
    };
  }

  @Get('test-environment-security')
  @RequireClubAdmin()
  @ApiOperation({ summary: 'Test environment security configuration' })
  @ApiResponse({ status: 200, description: 'Environment security test results' })
  async testEnvironmentSecurity() {
    const results = await Promise.all([
      this.securityTestingService.testEnvironmentSecurity(),
      this.securityTestingService.testSecretsManagement(),
      this.securityTestingService.testConfigurationTampering(),
    ]);

    return {
      environmentSecurity: results[0],
      secretsManagement: results[1],
      configurationTampering: results[2],
      timestamp: new Date().toISOString(),
    };
  }

  @Get('test-network-security')
  @RequireClubAdmin()
  @ApiOperation({ summary: 'Test network security (HTTPS, CORS, Rate Limiting)' })
  @ApiResponse({ status: 200, description: 'Network security test results' })
  async testNetworkSecurity() {
    const results = await Promise.all([
      this.securityTestingService.testHTTPSEnforcement(),
      this.securityTestingService.testCORSConfiguration(),
      this.securityTestingService.testRateLimiting(),
    ]);

    return {
      httpsEnforcement: results[0],
      corsConfiguration: results[1],
      rateLimiting: results[2],
      timestamp: new Date().toISOString(),
    };
  }

  @Get('test-security-monitoring')
  @RequireClubAdmin()
  @ApiOperation({ summary: 'Test security monitoring and logging' })
  @ApiResponse({ status: 200, description: 'Security monitoring test results' })
  async testSecurityMonitoring() {
    const results = await Promise.all([
      this.securityTestingService.testSecurityLogging(),
      this.securityTestingService.testThreatDetection(),
      this.securityTestingService.testAuditTrailIntegrity(),
    ]);

    return {
      securityLogging: results[0],
      threatDetection: results[1],
      auditTrailIntegrity: results[2],
      timestamp: new Date().toISOString(),
    };
  }

  @Get('test-performance')
  @RequireClubAdmin()
  @ApiOperation({ summary: 'Test security performance impact' })
  @ApiResponse({ status: 200, description: 'Security performance test results' })
  async testSecurityPerformance() {
    const results = await Promise.all([
      this.securityTestingService.testSecurityPerformance(),
      this.securityTestingService.testSecurityStress(),
    ]);

    return {
      performanceMetrics: results[0],
      stressTestResults: results[1],
      timestamp: new Date().toISOString(),
    };
  }

  @Get('test-compliance')
  @RequireClubAdmin()
  @ApiOperation({ summary: 'Test security compliance requirements' })
  @ApiResponse({ status: 200, description: 'Security compliance test results' })
  async testCompliance() {
    const results = await Promise.all([
      this.securityTestingService.testSecurityCompliance(),
      this.securityTestingService.testSecurityDocumentation(),
    ]);

    return {
      complianceRequirements: results[0],
      documentationRequirements: results[1],
      timestamp: new Date().toISOString(),
    };
  }

  @Post('generate-test-jwt')
  @RequireClubAdmin()
  @ApiOperation({ summary: 'Generate test JWT for security analysis' })
  @ApiResponse({ status: 200, description: 'Test JWT generated' })
  async generateTestJWT() {
    const token = await this.securityTestingService.generateTestJWT();
    
    return {
      token,
      note: 'This is a test JWT for security analysis only',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('dashboard')
  @RequireClubAdmin()
  @ApiOperation({ summary: 'Get security testing dashboard data' })
  @ApiResponse({ status: 200, description: 'Security testing dashboard data' })
  async getSecurityDashboard() {
    const report = this.securityTestingService.getSecurityTestReport();
    
    const criticalIssues = report.results.filter(r => !r.passed && r.riskLevel === 'CRITICAL');
    const highIssues = report.results.filter(r => !r.passed && r.riskLevel === 'HIGH');
    const mediumIssues = report.results.filter(r => !r.passed && r.riskLevel === 'MEDIUM');
    
    const securityScore = report.summary.total > 0 ? 
      Math.round((report.summary.passed / report.summary.total) * 100) : 100;

    return {
      securityScore,
      summary: report.summary,
      issuesByRisk: {
        critical: criticalIssues.length,
        high: highIssues.length,
        medium: mediumIssues.length,
        low: report.summary.failed - criticalIssues.length - highIssues.length - mediumIssues.length,
      },
      recentTests: report.results.slice(-10), // Last 10 tests
      recommendations: report.recommendations,
      lastTestRun: report.results.length > 0 ? 
        Math.max(...report.results.map(r => r.timestamp.getTime())) : null,
      timestamp: new Date().toISOString(),
    };
  }
}