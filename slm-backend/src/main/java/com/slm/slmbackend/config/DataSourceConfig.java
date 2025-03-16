package com.slm.slmbackend.config;

import com.ecwid.consul.v1.ConsulClient;
import com.ecwid.consul.v1.agent.model.Service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;
import java.util.List;
import java.util.Map;

@Configuration
@Slf4j
public class DataSourceConfig {

    @Autowired
    private ConsulClient consulClient;

    @Autowired
    private Environment env;

    @Bean
    public DataSource dataSource() {
        log.info("Creating datasource bean");
        Map<String, Service> servicesMap = consulClient.getAgentServices().getValue();
        List<Service> services = servicesMap.values().stream().toList();

        String jdbcUrl = getDBUrl(services);
        log.info("JDBC URL: {}", jdbcUrl);
        return DataSourceBuilder.create()
                .driverClassName("com.mysql.cj.jdbc.Driver")
                .url(jdbcUrl)
                .username(env.getProperty("DB_USERNAME", "root"))
                .password(env.getProperty("DB_PASSWORD", "root123"))
                .build();
    }

    private static String getDBUrl(List<Service> services) {
        String mysqlHost = null;
        int mysqlPort = 3306; // Default port for MySQL

        for (Service service : services) {
            if ("mysql".equals(service.getService())) {
                mysqlHost = service.getAddress();
                mysqlPort = service.getPort();
                break;
            }
        }

        if (mysqlHost == null) {
            throw new RuntimeException("MySQL service not found in Consul");
        }
        log.info("MySQL service found at {}:{}", mysqlHost, mysqlPort);
        return String.format("jdbc:mysql://%s:%d/slm", mysqlHost, mysqlPort);
    }
}
