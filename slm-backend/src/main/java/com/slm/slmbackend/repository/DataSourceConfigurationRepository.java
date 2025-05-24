package com.slm.slmbackend.repository;

import com.slm.slmbackend.entity.DataSourceConfiguration;
import com.slm.slmbackend.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DataSourceConfigurationRepository extends JpaRepository<DataSourceConfiguration, Integer> {
    List<DataSourceConfiguration> findAllByOwnersContains(UserAccount user);

    @Query("""
        SELECT DISTINCT dsc
        FROM DataSourceConfiguration dsc
            JOIN dsc.groups g
            JOIN g.members m
        WHERE m = :user
    """)
    List<DataSourceConfiguration> findAllDataSourceAvailableForUser(@Param("user") UserAccount user);
}
