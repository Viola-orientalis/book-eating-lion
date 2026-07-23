package com.bookeatinglion.api.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.io.InputStream;
import java.util.UUID;

@Slf4j
@Service
public class S3UploadService {

    private final S3Client s3Client;
    private final String bucket;
    private final String region;

    public S3UploadService(
            @Value("${aws.s3.bucket:team3-bookeatinglion-storage-s3}") String bucket,
            @Value("${aws.s3.region:ap-northeast-2}") String region) {
        this.bucket = bucket;
        this.region = region;
        this.s3Client = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }

    /**
     * MultipartFile의 InputStream을 사용하여 S3로 Streaming Upload를 수행합니다.
     */
    public String uploadStream(MultipartFile file, String dirName) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String key = dirName + "/" + UUID.randomUUID() + extension;

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(file.getContentType())
                .build();

        try (InputStream inputStream = file.getInputStream()) {
            s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(inputStream, file.getSize()));
            log.info("S3 Streaming Upload 성공: key={}", key);
        } catch (Exception e) {
            log.error("S3 Streaming Upload 실패: key={}", key, e);
            throw new RuntimeException("S3 파일 업로드에 실패했습니다.", e);
        }

        return String.format("https://%s.s3.%s.amazonaws.com/%s", bucket, region, key);
    }
}
